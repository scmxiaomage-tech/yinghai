package cart

type AddItemInput struct {
	SKUID uint64 `json:"skuId"`
	Quantity uint64 `json:"quantity"`
}

type QuantityInput struct {
	Quantity uint64 `json:"quantity"`
}

type SelectedInput struct {
	Selected bool `json:"selected"`
}

type SelectionInput struct {
	Selected bool `json:"selected"`
	ItemIDs []uint64 `json:"itemIds"`
}

type CartDTO struct {
	CartItems []CartItemDTO `json:"cartItems"`
	SelectedCount int `json:"selectedCount"`
	SelectedQuantity uint64 `json:"selectedQuantity"`
	Subtotal float64 `json:"subtotal"`
}

type CartItemDTO struct {
	ID uint64 `json:"id"`
	ProductID uint64 `json:"productId"`
	SKUID uint64 `json:"skuId"`
	ProductName string `json:"productName"`
	SKUName string `json:"skuName"`
	MainImageURL *string `json:"mainImageUrl,omitempty"`
	Quantity uint64 `json:"quantity"`
	Selected bool `json:"selected"`
	SalePrice float64 `json:"salePrice"`
	MarketPrice *float64 `json:"marketPrice,omitempty"`
	AvailableStock uint64 `json:"availableStock"`
	Available bool `json:"available"`
	UnavailableReason *string `json:"unavailableReason,omitempty"`
}

type CartRow struct {
	ID uint64
	ProductID uint64
	SKUID uint64
	ProductName string
	SKUName string
	MainImageURL *string
	Quantity uint64
	Selected bool
	SalePrice float64
	MarketPrice *float64
	SKUStatus string
	ShelfStatus string
	AvailableStock uint64
}
