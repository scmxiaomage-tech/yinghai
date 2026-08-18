package user

import (
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) DB() *gorm.DB {
	return r.db
}

func (r *Repository) FindByOpenID(openID string) (*User, error) {
	var model User
	err := r.db.Where("openid = ?", openID).First(&model).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *Repository) FindByID(id string) (*User, error) {
	var model User
	err := r.db.Preload("Profile").Where("id = ?", id).First(&model).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *Repository) CreateUserWithProfile(tx *gorm.DB, model *User, profile *UserProfile) error {
	if err := tx.Create(model).Error; err != nil {
		return err
	}
	profile.UserID = model.ID
	return tx.Create(profile).Error
}

func (r *Repository) TouchLogin(tx *gorm.DB, userID string, loginAt time.Time) error {
	return tx.Model(&User{}).Where("id = ?", userID).Update("last_login_at", loginAt).Error
}

func (r *Repository) CreateLoginRecord(tx *gorm.DB, record *UserLoginRecord) error {
	return tx.Create(record).Error
}

func (r *Repository) FindProfile(userID string) (*UserProfile, error) {
	var profile UserProfile
	err := r.db.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *Repository) UpsertProfile(userID string, profile *UserProfile) error {
	profile.UserID = userID
	return r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"nickname", "avatar_url", "gender", "birthday", "bio", "updated_at"}),
	}).Create(profile).Error
}

func (r *Repository) ListAddresses(userID string) ([]UserAddress, error) {
	var list []UserAddress
	err := r.db.Where("user_id = ?", userID).Order("is_default DESC, updated_at DESC").Find(&list).Error
	return list, err
}

func (r *Repository) CreateAddress(address *UserAddress) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if address.IsDefault {
			if err := tx.Model(&UserAddress{}).Where("user_id = ?", address.UserID).Update("is_default", false).Error; err != nil {
				return err
			}
		}
		return tx.Create(address).Error
	})
}

func (r *Repository) UpdateAddress(userID string, id string, address *UserAddress) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if address.IsDefault {
			if err := tx.Model(&UserAddress{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
				return err
			}
		}
		return tx.Model(&UserAddress{}).Where("id = ? AND user_id = ?", id, userID).Updates(map[string]any{
			"receiver_name": address.ReceiverName,
			"receiver_phone": address.ReceiverPhone,
			"province": address.Province,
			"city": address.City,
			"district": address.District,
			"detail_address": address.DetailAddress,
			"door_no": address.DoorNo,
			"longitude": address.Longitude,
			"latitude": address.Latitude,
			"is_default": address.IsDefault,
		}).Error
	})
}

func (r *Repository) DeleteAddress(userID string, id string) error {
	return r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&UserAddress{}).Error
}

func (r *Repository) SetDefaultAddress(userID string, id string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&UserAddress{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
			return err
		}
		return tx.Model(&UserAddress{}).Where("id = ? AND user_id = ?", id, userID).Update("is_default", true).Error
	})
}
