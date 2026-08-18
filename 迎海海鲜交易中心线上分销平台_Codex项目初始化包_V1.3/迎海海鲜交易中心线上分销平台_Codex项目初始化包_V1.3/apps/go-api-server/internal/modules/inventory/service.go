package inventory

import (
	"errors"
	"fmt"

	"gorm.io/gorm"
)

var (
	ErrInventoryNotFound  = errors.New("INVENTORY_NOT_FOUND")
	ErrInsufficientStock  = errors.New("INSUFFICIENT_STOCK")
	ErrInvalidQuantity    = errors.New("INVALID_INVENTORY_QUANTITY")
	ErrInventoryConflict  = errors.New("INVENTORY_CONFLICT")
	ErrDuplicateOperation = errors.New("DUPLICATE_INVENTORY_OPERATION")
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetInventory(skuID uint64) (*InventoryDTO, error) {
	result, err := s.repo.ListInventories(InventoryQuery{SKUID: &skuID, Page: 1, PageSize: 1})
	if err != nil {
		return nil, err
	}
	if len(result.Items) == 0 {
		return nil, ErrInventoryNotFound
	}
	return &result.Items[0], nil
}

func (s *Service) ListInventories(query InventoryQuery) (PageResult[InventoryDTO], error) {
	return s.repo.ListInventories(query)
}

func (s *Service) ListTransactions(query TransactionQuery) (PageResult[InventoryTransaction], error) {
	return s.repo.ListTransactions(query)
}

func (s *Service) AdjustInventory(skuID uint64, input AdjustInput) (*InventoryDTO, error) {
	if input.Quantity == 0 {
		return nil, ErrInvalidQuantity
	}
	txType := input.AdjustmentType
	if txType != TxIncrease && txType != TxDecrease {
		return nil, ErrInvalidQuantity
	}
	if input.OperatorType == "" {
		input.OperatorType = "admin"
	}
	if input.ReferenceType == nil || input.ReferenceID == nil {
		refType := "ADMIN_ADJUST"
		refID := fmt.Sprintf("%d-%s-%d", skuID, txType, input.Quantity)
		input.ReferenceType = &refType
		input.ReferenceID = &refID
	}
	err := s.repo.Transaction(func(tx *gorm.DB) error {
		before, err := s.repo.EnsureInventory(tx, skuID)
		if err != nil {
			return err
		}
		var rows int64
		if txType == TxIncrease {
			rows, err = s.repo.AtomicIncrease(tx, skuID, input.Quantity)
		} else {
			rows, err = s.repo.AtomicDecrease(tx, skuID, input.Quantity)
		}
		if err != nil {
			return err
		}
		if rows == 0 {
			return ErrInsufficientStock
		}
		after, err := s.repo.FindBySKUID(tx, skuID)
		if err != nil {
			return err
		}
		return s.repo.CreateTransaction(tx, &InventoryTransaction{SKUID: skuID, Type: txType, Quantity: input.Quantity, BeforeStock: before.TotalStock, AfterStock: after.TotalStock, BeforeLockedStock: before.LockedStock, AfterLockedStock: after.LockedStock, ReferenceType: input.ReferenceType, ReferenceID: input.ReferenceID, Remark: input.Remark, OperatorType: input.OperatorType, OperatorID: input.OperatorID})
	})
	if err != nil {
		return nil, mapInventoryErr(err)
	}
	return s.GetInventory(skuID)
}

func (s *Service) LockInventory(input OperationInput) error {
	return s.stockOperation(TxLock, input)
}

func (s *Service) LockInventoryWithTx(tx *gorm.DB, input OperationInput) error {
	return s.stockOperationWithTx(tx, TxLock, input)
}

func (s *Service) UnlockInventory(input OperationInput) error {
	return s.stockOperation(TxUnlock, input)
}

func (s *Service) UnlockInventoryWithTx(tx *gorm.DB, input OperationInput) error {
	return s.stockOperationWithTx(tx, TxUnlock, input)
}

func (s *Service) DeductInventory(input OperationInput) error {
	return s.stockOperation(TxDeduct, input)
}

func (s *Service) DeductInventoryWithTx(tx *gorm.DB, input OperationInput) error {
	return s.stockOperationWithTx(tx, TxDeduct, input)
}

func (s *Service) RefundReturnInventoryWithTx(tx *gorm.DB, input OperationInput) error {
	return s.stockOperationWithTx(tx, TxRefundReturn, input)
}

func (s *Service) stockOperation(txType string, input OperationInput) error {
	if input.Quantity == 0 || input.SKUID == 0 || input.ReferenceType == "" || input.ReferenceID == "" {
		return ErrInvalidQuantity
	}
	if input.OperatorType == "" {
		input.OperatorType = "system"
	}
	return mapInventoryErr(s.repo.Transaction(func(tx *gorm.DB) error {
		return s.stockOperationWithTx(tx, txType, input)
	}))
}

func (s *Service) stockOperationWithTx(tx *gorm.DB, txType string, input OperationInput) error {
	if input.Quantity == 0 || input.SKUID == 0 || input.ReferenceType == "" || input.ReferenceID == "" {
		return ErrInvalidQuantity
	}
	if input.OperatorType == "" {
		input.OperatorType = "system"
	}
	if _, err := s.repo.FindTransactionByReference(tx, input.SKUID, txType, input.ReferenceType, input.ReferenceID); err == nil {
		return ErrDuplicateOperation
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	before, err := s.repo.FindBySKUID(tx, input.SKUID)
	if err != nil {
		return mapInventoryErr(err)
	}
	var rows int64
	switch txType {
	case TxLock:
		rows, err = s.repo.AtomicLock(tx, input.SKUID, input.Quantity)
	case TxUnlock:
		rows, err = s.repo.AtomicUnlock(tx, input.SKUID, input.Quantity)
	case TxDeduct:
		rows, err = s.repo.AtomicDeduct(tx, input.SKUID, input.Quantity)
	case TxRefundReturn:
		rows, err = s.repo.AtomicRefundReturn(tx, input.SKUID, input.Quantity)
	default:
		return ErrInvalidQuantity
	}
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrInsufficientStock
	}
	after, err := s.repo.FindBySKUID(tx, input.SKUID)
	if err != nil {
		return mapInventoryErr(err)
	}
	return s.repo.CreateTransaction(tx, &InventoryTransaction{SKUID: input.SKUID, Type: txType, Quantity: input.Quantity, BeforeStock: before.TotalStock, AfterStock: after.TotalStock, BeforeLockedStock: before.LockedStock, AfterLockedStock: after.LockedStock, ReferenceType: &input.ReferenceType, ReferenceID: &input.ReferenceID, Remark: input.Remark, OperatorType: input.OperatorType, OperatorID: input.OperatorID})
}

func mapInventoryErr(err error) error {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrInventoryNotFound
	}
	return err
}
