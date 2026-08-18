package inventory

type InventoryDTO struct {
	SKUID          uint64 `json:"skuId"`
	SKUNo          string `json:"skuNo,omitempty"`
	SKUName        string `json:"skuName,omitempty"`
	ProductID      uint64 `json:"productId,omitempty"`
	ProductName    string `json:"productName,omitempty"`
	TotalStock     uint64 `json:"totalStock"`
	LockedStock    uint64 `json:"lockedStock"`
	AvailableStock uint64 `json:"availableStock"`
	SoldStock      uint64 `json:"soldStock"`
	WarningStock   uint64 `json:"warningStock"`
	StockStatus    string `json:"stockStatus"`
	Version        uint64 `json:"version"`
}

type InventoryQuery struct {
	SKUID       *uint64
	ProductID   *uint64
	Keyword     string
	StockStatus string
	LowStock    bool
	OutOfStock  bool
	Page        int
	PageSize    int
}

type TransactionQuery struct {
	SKUID           *uint64
	ProductID       *uint64
	TransactionType string
	StartAt         string
	EndAt           string
	Page            int
	PageSize        int
}

type AdjustInput struct {
	AdjustmentType string  `json:"adjustmentType"`
	Quantity       uint64  `json:"quantity"`
	Remark         *string `json:"remark"`
	ReferenceType  *string `json:"referenceType"`
	ReferenceID    *string `json:"referenceId"`
	OperatorType   string  `json:"operatorType"`
	OperatorID     *string `json:"operatorId"`
}

type OperationInput struct {
	SKUID         uint64
	Quantity      uint64
	ReferenceType string
	ReferenceID   string
	Remark        *string
	OperatorType  string
	OperatorID    *string
}

type PageResult[T any] struct {
	Page     int   `json:"page"`
	PageSize int   `json:"pageSize"`
	Total    int64 `json:"total"`
	Items    []T   `json:"items"`
}
