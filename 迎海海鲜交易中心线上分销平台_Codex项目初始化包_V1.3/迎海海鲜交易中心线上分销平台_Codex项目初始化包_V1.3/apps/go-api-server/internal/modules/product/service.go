package product

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var (
	ErrCategoryNotFound = errors.New("CATEGORY_NOT_FOUND")
	ErrCategoryDisabled = errors.New("CATEGORY_DISABLED")
	ErrProductNotFound = errors.New("PRODUCT_NOT_FOUND")
	ErrProductNotOnSale = errors.New("PRODUCT_NOT_ON_SALE")
	ErrProductCannotOnSale = errors.New("PRODUCT_CANNOT_ON_SALE")
	ErrSKUNotFound = errors.New("SKU_NOT_FOUND")
	ErrSKUPriceInvalid = errors.New("SKU_PRICE_INVALID")
	ErrValidation = errors.New("VALIDATION_ERROR")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListCategories(includeDisabled bool) ([]CategoryDTO, error) {
	list, err := s.repo.ListCategories(includeDisabled)
	if err != nil {
		return nil, err
	}
	out := make([]CategoryDTO, 0, len(list))
	for _, item := range list {
		out = append(out, categoryDTO(item))
	}
	return out, nil
}

func (s *Service) CreateCategory(input CategoryInput) (*CategoryDTO, error) {
	if input.Name == "" || input.Code == "" {
		return nil, ErrValidation
	}
	status := input.Status
	if status == "" {
		status = CategoryStatusEnabled
	}
	model := &Category{ParentID: input.ParentID, Name: input.Name, Code: input.Code, IconURL: input.IconURL, ImageURL: input.ImageURL, SortOrder: input.SortOrder, Status: status}
	if err := s.repo.CreateCategory(model); err != nil {
		return nil, err
	}
	dto := categoryDTO(*model)
	return &dto, nil
}

func (s *Service) UpdateCategory(id uint64, input CategoryInput) error {
	values := map[string]any{"name": input.Name, "code": input.Code, "parent_id": input.ParentID, "icon_url": input.IconURL, "image_url": input.ImageURL, "sort_order": input.SortOrder}
	if input.Status != "" {
		values["status"] = input.Status
	}
	return mapNotFound(s.repo.UpdateCategory(id, values), ErrCategoryNotFound)
}

func (s *Service) DeleteCategory(id uint64) error {
	err := s.repo.DeleteCategory(id)
	if errors.Is(err, ErrCategoryHasProducts) {
		return ErrCategoryHasProducts
	}
	return mapNotFound(err, ErrCategoryNotFound)
}

func (s *Service) ListProducts(query ProductQuery) (PageResult[ProductListDTO], error) {
	result, err := s.repo.ListProducts(query)
	if err != nil {
		return PageResult[ProductListDTO]{}, err
	}
	items := make([]ProductListDTO, 0, len(result.Items))
	for _, item := range result.Items {
		items = append(items, productListDTO(item))
	}
	return PageResult[ProductListDTO]{Page: result.Page, PageSize: result.PageSize, Total: result.Total, Items: items}, nil
}

func (s *Service) ProductDetail(id uint64, onlyOnSale bool) (*ProductDetailDTO, error) {
	model, err := s.repo.FindProduct(id, onlyOnSale)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) && onlyOnSale {
			return nil, ErrProductNotOnSale
		}
		return nil, mapNotFound(err, ErrProductNotFound)
	}
	dto := productDetailDTO(*model, onlyOnSale)
	s.applyInventoryToDetail(&dto)
	return &dto, nil
}

func (s *Service) CreateProduct(input ProductInput) (*ProductListDTO, error) {
	if input.Name == "" || input.Unit == "" || input.CategoryID == 0 {
		return nil, ErrValidation
	}
	category, err := s.repo.FindCategory(input.CategoryID)
	if err != nil {
		return nil, ErrCategoryNotFound
	}
	if category.Status != CategoryStatusEnabled {
		return nil, ErrCategoryDisabled
	}
	status := input.ShelfStatus
	if status == "" {
		status = ProductShelfDraft
	}
	model := &Product{
		ProductNo: generateNo("PRD"),
		CategoryID: input.CategoryID,
		Name: input.Name,
		Subtitle: input.Subtitle,
		MainImageURL: input.MainImageURL,
		Description: input.Description,
		Unit: input.Unit,
		Origin: input.Origin,
		StorageMethod: input.StorageMethod,
		ShelfStatus: status,
		RecommendStatus: input.RecommendStatus,
		SortOrder: input.SortOrder,
	}
	if status == ProductShelfOnSale && !canOnSale(*model, nil, category) {
		return nil, ErrProductCannotOnSale
	}
	if err := s.repo.CreateProduct(model); err != nil {
		return nil, err
	}
	model.Category = *category
	dto := productListDTO(*model)
	return &dto, nil
}

func (s *Service) UpdateProduct(id uint64, input ProductInput) error {
	if input.Name == "" || input.Unit == "" || input.CategoryID == 0 {
		return ErrValidation
	}
	category, err := s.repo.FindCategory(input.CategoryID)
	if err != nil {
		return ErrCategoryNotFound
	}
	if category.Status != CategoryStatusEnabled {
		return ErrCategoryDisabled
	}
	values := map[string]any{
		"category_id": input.CategoryID,
		"name": input.Name,
		"subtitle": input.Subtitle,
		"main_image_url": input.MainImageURL,
		"description": input.Description,
		"unit": input.Unit,
		"origin": input.Origin,
		"storage_method": input.StorageMethod,
		"recommend_status": input.RecommendStatus,
		"sort_order": input.SortOrder,
	}
	if input.ShelfStatus != "" {
		values["shelf_status"] = input.ShelfStatus
	}
	return mapNotFound(s.repo.UpdateProduct(id, values), ErrProductNotFound)
}

func (s *Service) OnSale(id uint64) error {
	model, err := s.repo.FindProduct(id, false)
	if err != nil {
		return ErrProductNotFound
	}
	if !canOnSale(*model, model.SKUs, &model.Category) {
		return ErrProductCannotOnSale
	}
	return s.repo.SetProductShelf(id, ProductShelfOnSale)
}

func (s *Service) OffSale(id uint64) error {
	return mapNotFound(s.repo.SetProductShelf(id, ProductShelfOffSale), ErrProductNotFound)
}

func (s *Service) CreateSKU(productID uint64, input SKUInput) (*AdminSKUDTO, error) {
	if input.Name == "" || input.SalePrice < 0 {
		return nil, ErrSKUPriceInvalid
	}
	if _, err := s.repo.FindProduct(productID, false); err != nil {
		return nil, ErrProductNotFound
	}
	status := input.Status
	if status == "" {
		status = SKUStatusEnabled
	}
	raw, _ := json.Marshal(input.Spec)
	model := &SKU{SKUNo: generateNo("SKU"), ProductID: productID, Name: input.Name, SpecJSON: datatypes.JSON(raw), CostPrice: input.CostPrice, SalePrice: input.SalePrice, MarketPrice: input.MarketPrice, MemberPrice: input.MemberPrice, Weight: input.Weight, WeightUnit: input.WeightUnit, Status: status, SortOrder: input.SortOrder}
	if err := s.repo.CreateSKU(model); err != nil {
		return nil, err
	}
	dto := adminSKUDTO(*model)
	return &dto, nil
}

func (s *Service) UpdateSKU(id uint64, input SKUInput) error {
	if input.Name == "" || input.SalePrice < 0 {
		return ErrSKUPriceInvalid
	}
	raw, _ := json.Marshal(input.Spec)
	values := map[string]any{"name": input.Name, "spec_json": datatypes.JSON(raw), "cost_price": input.CostPrice, "sale_price": input.SalePrice, "market_price": input.MarketPrice, "member_price": input.MemberPrice, "weight": input.Weight, "weight_unit": input.WeightUnit, "sort_order": input.SortOrder}
	if input.Status != "" {
		values["status"] = input.Status
	}
	return mapNotFound(s.repo.UpdateSKU(id, values), ErrSKUNotFound)
}

func (s *Service) DeleteSKU(id uint64) error {
	return mapNotFound(s.repo.DeleteSKU(id), ErrSKUNotFound)
}

func (s *Service) AddImage(productID uint64, input ImageInput) (*ImageDTO, error) {
	if input.ImageURL == "" {
		return nil, ErrValidation
	}
	if input.ImageType == "" {
		input.ImageType = ImageTypeDetail
	}
	if _, err := s.repo.FindProduct(productID, false); err != nil {
		return nil, ErrProductNotFound
	}
	model := &ProductImage{ProductID: productID, ImageURL: input.ImageURL, ImageType: input.ImageType, SortOrder: input.SortOrder}
	if err := s.repo.AddImage(model); err != nil {
		return nil, err
	}
	dto := ImageDTO{ID: model.ID, ImageURL: model.ImageURL, ImageType: model.ImageType, SortOrder: model.SortOrder}
	return &dto, nil
}

func (s *Service) DeleteImage(id uint64) error {
	return mapNotFound(s.repo.DeleteImage(id), ErrProductNotFound)
}

func canOnSale(model Product, skus []SKU, category *Category) bool {
	if category == nil || category.Status != CategoryStatusEnabled || model.Name == "" || model.MainImageURL == nil || *model.MainImageURL == "" {
		return false
	}
	for _, sku := range skus {
		if sku.Status == SKUStatusEnabled && sku.SalePrice >= 0 {
			return true
		}
	}
	return false
}

func categoryDTO(item Category) CategoryDTO {
	return CategoryDTO{ID: item.ID, ParentID: item.ParentID, Name: item.Name, Code: item.Code, IconURL: item.IconURL, ImageURL: item.ImageURL, SortOrder: item.SortOrder, Status: item.Status}
}

func productListDTO(item Product) ProductListDTO {
	min, max, market, hasStock := skuSummary(item.SKUs)
	return ProductListDTO{ID: item.ID, ProductNo: item.ProductNo, Name: item.Name, Subtitle: item.Subtitle, MainImageURL: item.MainImageURL, Unit: item.Unit, CategoryID: item.CategoryID, CategoryName: item.Category.Name, MinSalePrice: min, MaxSalePrice: max, MarketPrice: market, HasStock: hasStock, RecommendStatus: item.RecommendStatus, ShelfStatus: item.ShelfStatus}
}

func productDetailDTO(item Product, onlyEnabledSKU bool) ProductDetailDTO {
	images := make([]ImageDTO, 0, len(item.Images))
	for _, img := range item.Images {
		images = append(images, ImageDTO{ID: img.ID, ImageURL: img.ImageURL, ImageType: img.ImageType, SortOrder: img.SortOrder})
	}
	skus := make([]SKUDTO, 0, len(item.SKUs))
	for _, sku := range item.SKUs {
		if onlyEnabledSKU && sku.Status != SKUStatusEnabled {
			continue
		}
		skus = append(skus, skuDTO(sku))
	}
	return ProductDetailDTO{Product: productListDTO(item), Category: categoryDTO(item.Category), Images: images, SKUs: skus, Description: item.Description, Origin: item.Origin, StorageMethod: item.StorageMethod}
}

func skuDTO(sku SKU) SKUDTO {
	return SKUDTO{ID: sku.ID, SKUNo: sku.SKUNo, Name: sku.Name, Spec: decodeSpec(sku.SpecJSON), SalePrice: sku.SalePrice, MarketPrice: sku.MarketPrice, MemberPrice: sku.MemberPrice, Weight: sku.Weight, WeightUnit: sku.WeightUnit, Status: sku.Status}
}

func (s *Service) applyInventoryToDetail(dto *ProductDetailDTO) {
	ids := make([]uint64, 0, len(dto.SKUs))
	for _, sku := range dto.SKUs {
		ids = append(ids, sku.ID)
	}
	snapshots, err := s.repo.InventorySnapshots(ids)
	if err != nil {
		return
	}
	for i := range dto.SKUs {
		snapshot, ok := snapshots[dto.SKUs[i].ID]
		if !ok {
			dto.SKUs[i].StockStatus = "OUT_OF_STOCK"
			continue
		}
		dto.SKUs[i].AvailableStock = snapshot.AvailableStock
		dto.SKUs[i].StockStatus = productStockStatus(snapshot.AvailableStock, snapshot.WarningStock)
	}
}

func productStockStatus(available uint64, warning uint64) string {
	if available == 0 {
		return "OUT_OF_STOCK"
	}
	if available <= warning {
		return "LOW_STOCK"
	}
	return "IN_STOCK"
}

func adminSKUDTO(sku SKU) AdminSKUDTO {
	return AdminSKUDTO{SKUDTO: skuDTO(sku), CostPrice: sku.CostPrice}
}

func skuSummary(skus []SKU) (*float64, *float64, *float64, bool) {
	var min, max, market float64
	has := false
	for _, sku := range skus {
		if sku.Status != SKUStatusEnabled {
			continue
		}
		if !has || sku.SalePrice < min {
			min = sku.SalePrice
		}
		if !has || sku.SalePrice > max {
			max = sku.SalePrice
		}
		if sku.MarketPrice != nil && (!has || *sku.MarketPrice > market) {
			market = *sku.MarketPrice
		}
		has = true
	}
	if !has {
		return nil, nil, nil, false
	}
	var marketPtr *float64
	if market > 0 {
		marketPtr = &market
	}
	return &min, &max, marketPtr, true
}

func mapNotFound(err error, mapped error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return mapped
	}
	return err
}

func generateNo(prefix string) string {
	return fmt.Sprintf("%s%s%s", prefix, time.Now().Format("20060102150405"), strconv.FormatInt(time.Now().UnixNano()%1000000, 10))
}
