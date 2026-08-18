package product

import "encoding/json"

type PageResult[T any] struct {
	Page int `json:"page"`
	PageSize int `json:"pageSize"`
	Total int64 `json:"total"`
	Items []T `json:"items"`
}

type ProductQuery struct {
	CategoryID *uint64
	Keyword string
	Page int
	PageSize int
	Sort string
	OnlyOnSale bool
	RecommendedOnly bool
}

type CategoryInput struct {
	ParentID *uint64 `json:"parentId"`
	Name string `json:"name"`
	Code string `json:"code"`
	IconURL *string `json:"iconUrl"`
	ImageURL *string `json:"imageUrl"`
	SortOrder int `json:"sortOrder"`
	Status string `json:"status"`
}

type ProductInput struct {
	CategoryID uint64 `json:"categoryId"`
	Name string `json:"name"`
	Subtitle *string `json:"subtitle"`
	MainImageURL *string `json:"mainImageUrl"`
	Description *string `json:"description"`
	Unit string `json:"unit"`
	Origin *string `json:"origin"`
	StorageMethod *string `json:"storageMethod"`
	ShelfStatus string `json:"shelfStatus"`
	RecommendStatus bool `json:"recommendStatus"`
	SortOrder int `json:"sortOrder"`
}

type SKUInput struct {
	Name string `json:"name"`
	Spec map[string]any `json:"spec"`
	CostPrice *float64 `json:"costPrice"`
	SalePrice float64 `json:"salePrice"`
	MarketPrice *float64 `json:"marketPrice"`
	MemberPrice *float64 `json:"memberPrice"`
	Weight *float64 `json:"weight"`
	WeightUnit *string `json:"weightUnit"`
	Status string `json:"status"`
	SortOrder int `json:"sortOrder"`
}

type ImageInput struct {
	ImageURL string `json:"imageUrl"`
	ImageType string `json:"imageType"`
	SortOrder int `json:"sortOrder"`
}

type CategoryDTO struct {
	ID uint64 `json:"id"`
	ParentID *uint64 `json:"parentId,omitempty"`
	Name string `json:"name"`
	Code string `json:"code"`
	IconURL *string `json:"iconUrl,omitempty"`
	ImageURL *string `json:"imageUrl,omitempty"`
	SortOrder int `json:"sortOrder"`
	Status string `json:"status"`
}

type ProductListDTO struct {
	ID uint64 `json:"id"`
	ProductNo string `json:"productNo"`
	Name string `json:"name"`
	Subtitle *string `json:"subtitle,omitempty"`
	MainImageURL *string `json:"mainImageUrl,omitempty"`
	Unit string `json:"unit"`
	CategoryID uint64 `json:"categoryId"`
	CategoryName string `json:"categoryName,omitempty"`
	MinSalePrice *float64 `json:"minSalePrice,omitempty"`
	MaxSalePrice *float64 `json:"maxSalePrice,omitempty"`
	MarketPrice *float64 `json:"marketPrice,omitempty"`
	HasStock bool `json:"hasStock"`
	RecommendStatus bool `json:"recommendStatus"`
	ShelfStatus string `json:"shelfStatus,omitempty"`
}

type ProductDetailDTO struct {
	Product ProductListDTO `json:"product"`
	Category CategoryDTO `json:"category"`
	Images []ImageDTO `json:"images"`
	SKUs []SKUDTO `json:"skus"`
	Description *string `json:"description,omitempty"`
	Origin *string `json:"origin,omitempty"`
	StorageMethod *string `json:"storageMethod,omitempty"`
}

type ImageDTO struct {
	ID uint64 `json:"id"`
	ImageURL string `json:"imageUrl"`
	ImageType string `json:"imageType"`
	SortOrder int `json:"sortOrder"`
}

type SKUDTO struct {
	ID uint64 `json:"id"`
	SKUNo string `json:"skuNo"`
	Name string `json:"name"`
	Spec map[string]any `json:"spec"`
	SalePrice float64 `json:"salePrice"`
	MarketPrice *float64 `json:"marketPrice,omitempty"`
	MemberPrice *float64 `json:"memberPrice,omitempty"`
	Weight *float64 `json:"weight,omitempty"`
	WeightUnit *string `json:"weightUnit,omitempty"`
	Status string `json:"status"`
	AvailableStock uint64 `json:"availableStock"`
	StockStatus string `json:"stockStatus"`
}

type AdminSKUDTO struct {
	SKUDTO
	CostPrice *float64 `json:"costPrice,omitempty"`
}

func decodeSpec(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var spec map[string]any
	if err := json.Unmarshal(raw, &spec); err != nil {
		return map[string]any{}
	}
	return spec
}
