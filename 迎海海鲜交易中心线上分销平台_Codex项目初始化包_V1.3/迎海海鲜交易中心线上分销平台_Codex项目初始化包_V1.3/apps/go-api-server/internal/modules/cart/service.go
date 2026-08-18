package cart

import (
	"errors"

	"gorm.io/gorm"
)

var (
	ErrCartItemNotFound = errors.New("CART_ITEM_NOT_FOUND")
	ErrQuantityInvalid = errors.New("CART_QUANTITY_INVALID")
	ErrQuantityLimit = errors.New("CART_QUANTITY_LIMIT_EXCEEDED")
	ErrCartItemUnavailable = errors.New("CART_ITEM_UNAVAILABLE")
	ErrProductOffShelf = errors.New("PRODUCT_OFF_SHELF")
	ErrSKUNotFound = errors.New("SKU_NOT_FOUND")
	ErrSKUDisabled = errors.New("SKU_DISABLED")
	ErrInsufficientStock = errors.New("INSUFFICIENT_STOCK")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetCart(userID string) (*CartDTO, error) {
	rows, err := s.repo.ListRows(userID)
	if err != nil { return nil, err }
	items := make([]CartItemDTO, 0, len(rows))
	dto := &CartDTO{CartItems: items}
	for _, row := range rows {
		item := toDTO(row)
		if item.Selected && item.Available {
			dto.SelectedCount++
			dto.SelectedQuantity += item.Quantity
			dto.Subtotal += item.SalePrice * float64(item.Quantity)
		}
		dto.CartItems = append(dto.CartItems, item)
	}
	return dto, nil
}

func (s *Service) AddItem(userID string, input AddItemInput) error {
	if err := validateQuantity(input.Quantity); err != nil { return err }
	productID, skuStatus, shelfStatus, available, err := s.repo.FindSKUProduct(input.SKUID)
	if err != nil { return mapCartNotFound(err, ErrSKUNotFound) }
	if shelfStatus != "on_sale" { return ErrProductOffShelf }
	if skuStatus != "enabled" { return ErrSKUDisabled }
	if available == 0 || input.Quantity > available { return ErrInsufficientStock }
	return s.repo.AddOrIncrement(userID, productID, input.SKUID, input.Quantity)
}

func (s *Service) UpdateQuantity(userID string, id uint64, input QuantityInput) error {
	if err := validateQuantity(input.Quantity); err != nil { return err }
	cart, err := s.GetCart(userID)
	if err != nil { return err }
	for _, item := range cart.CartItems {
		if item.ID == id {
			if !item.Available { return ErrCartItemUnavailable }
			if input.Quantity > item.AvailableStock { return ErrInsufficientStock }
			return mapCartNotFound(s.repo.UpdateQuantity(userID, id, input.Quantity), ErrCartItemNotFound)
		}
	}
	return ErrCartItemNotFound
}

func (s *Service) UpdateSelected(userID string, id uint64, selected bool) error {
	return mapCartNotFound(s.repo.UpdateSelected(userID, id, selected), ErrCartItemNotFound)
}

func (s *Service) UpdateSelection(userID string, input SelectionInput) error {
	return s.repo.UpdateSelection(userID, input.ItemIDs, input.Selected)
}

func (s *Service) RemoveItem(userID string, id uint64) error {
	return mapCartNotFound(s.repo.RemoveItem(userID, id), ErrCartItemNotFound)
}

func (s *Service) RemoveUnavailableItems(userID string) error {
	cart, err := s.GetCart(userID)
	if err != nil { return err }
	ids := make([]uint64, 0)
	for _, item := range cart.CartItems {
		if !item.Available && item.UnavailableReason != nil && *item.UnavailableReason != ReasonInsufficientStock {
			ids = append(ids, item.ID)
		}
	}
	return s.repo.RemoveItems(userID, ids)
}

func validateQuantity(quantity uint64) error {
	if quantity < 1 { return ErrQuantityInvalid }
	if quantity > MaxQuantity { return ErrQuantityLimit }
	return nil
}

func toDTO(row CartRow) CartItemDTO {
	item := CartItemDTO{ID: row.ID, ProductID: row.ProductID, SKUID: row.SKUID, ProductName: row.ProductName, SKUName: row.SKUName, MainImageURL: row.MainImageURL, Quantity: row.Quantity, Selected: row.Selected, SalePrice: row.SalePrice, MarketPrice: row.MarketPrice, AvailableStock: row.AvailableStock, Available: true}
	var reason *string
	switch {
	case row.ShelfStatus != "on_sale":
		v := ReasonProductOffShelf; reason = &v
	case row.SKUStatus != "enabled":
		v := ReasonSKUDisabled; reason = &v
	case row.AvailableStock == 0:
		v := ReasonOutOfStock; reason = &v
	case row.Quantity > row.AvailableStock:
		v := ReasonInsufficientStock; reason = &v
	}
	if reason != nil {
		item.Available = false
		item.UnavailableReason = reason
	}
	return item
}

func mapCartNotFound(err error, mapped error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) { return mapped }
	return err
}
