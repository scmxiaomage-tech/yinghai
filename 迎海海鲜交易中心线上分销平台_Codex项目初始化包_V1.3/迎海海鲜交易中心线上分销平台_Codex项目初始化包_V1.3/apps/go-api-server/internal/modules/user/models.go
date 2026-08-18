package user

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID string `gorm:"type:char(36);primaryKey" json:"id"`
	OpenID string `gorm:"column:openid;size:128;uniqueIndex;not null" json:"openid"`
	UnionID *string `gorm:"column:unionid;size:128" json:"unionid,omitempty"`
	Phone *string `gorm:"size:32;index" json:"phone,omitempty"`
	Status string `gorm:"size:32;not null;default:active" json:"status"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Profile UserProfile `gorm:"foreignKey:UserID" json:"profile,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.NewString()
	}
	return nil
}

type UserProfile struct {
	ID string `gorm:"type:char(36);primaryKey" json:"id"`
	UserID string `gorm:"type:char(36);uniqueIndex;not null" json:"userId"`
	Nickname *string `gorm:"size:64" json:"nickname,omitempty"`
	AvatarURL *string `gorm:"size:512" json:"avatarUrl,omitempty"`
	Gender *string `gorm:"size:16" json:"gender,omitempty"`
	Birthday *time.Time `gorm:"type:date" json:"birthday,omitempty"`
	Bio *string `gorm:"size:255" json:"bio,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *UserProfile) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.NewString()
	}
	return nil
}

type UserAddress struct {
	ID string `gorm:"type:char(36);primaryKey" json:"id"`
	UserID string `gorm:"type:char(36);index;not null" json:"userId"`
	ReceiverName string `gorm:"size:64;not null" json:"receiverName"`
	ReceiverPhone string `gorm:"size:32;not null" json:"receiverPhone"`
	Province string `gorm:"size:64;not null" json:"province"`
	City string `gorm:"size:64;not null" json:"city"`
	District string `gorm:"size:64;not null" json:"district"`
	DetailAddress string `gorm:"size:255;not null" json:"detailAddress"`
	DoorNo *string `gorm:"size:64" json:"doorNo,omitempty"`
	Longitude *float64 `gorm:"type:decimal(10,6)" json:"longitude,omitempty"`
	Latitude *float64 `gorm:"type:decimal(10,6)" json:"latitude,omitempty"`
	IsDefault bool `gorm:"not null;default:false" json:"isDefault"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (a *UserAddress) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.NewString()
	}
	return nil
}

type UserLoginRecord struct {
	ID string `gorm:"type:char(36);primaryKey" json:"id"`
	UserID string `gorm:"type:char(36);index;not null" json:"userId"`
	LoginType string `gorm:"size:32;not null;default:wechat" json:"loginType"`
	IP *string `gorm:"size:64" json:"ip,omitempty"`
	UserAgent *string `gorm:"size:512" json:"userAgent,omitempty"`
	DeviceID *string `gorm:"size:128" json:"deviceId,omitempty"`
	LoginAt time.Time `gorm:"not null" json:"loginAt"`
	CreatedAt time.Time `json:"createdAt"`
}

func (r *UserLoginRecord) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.NewString()
	}
	if r.LoginAt.IsZero() {
		r.LoginAt = time.Now()
	}
	return nil
}
