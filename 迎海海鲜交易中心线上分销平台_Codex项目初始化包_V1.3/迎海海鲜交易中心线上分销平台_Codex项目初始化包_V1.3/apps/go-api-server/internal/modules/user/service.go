package user

import (
	"errors"
)

type Service struct {
	repo *Repository
}

type ProfileInput struct {
	Nickname *string `json:"nickname"`
	AvatarURL *string `json:"avatarUrl"`
	Gender *string `json:"gender"`
	Bio *string `json:"bio"`
}

type AddressInput struct {
	ReceiverName string `json:"receiverName"`
	ReceiverPhone string `json:"receiverPhone"`
	Province string `json:"province"`
	City string `json:"city"`
	District string `json:"district"`
	DetailAddress string `json:"detailAddress"`
	DoorNo *string `json:"doorNo"`
	Longitude *float64 `json:"longitude"`
	Latitude *float64 `json:"latitude"`
	IsDefault bool `json:"isDefault"`
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Me(userID string) (*User, error) {
	return s.repo.FindByID(userID)
}

func (s *Service) Profile(userID string) (*UserProfile, error) {
	return s.repo.FindProfile(userID)
}

func (s *Service) UpdateProfile(userID string, input ProfileInput) (*UserProfile, error) {
	profile := &UserProfile{
		UserID: userID,
		Nickname: input.Nickname,
		AvatarURL: input.AvatarURL,
		Gender: input.Gender,
		Bio: input.Bio,
	}
	if err := s.repo.UpsertProfile(userID, profile); err != nil {
		return nil, err
	}
	return s.repo.FindProfile(userID)
}

func (s *Service) ListAddresses(userID string) ([]UserAddress, error) {
	return s.repo.ListAddresses(userID)
}

func (s *Service) CreateAddress(userID string, input AddressInput) (*UserAddress, error) {
	if err := validateAddress(input); err != nil {
		return nil, err
	}
	address := input.toModel(userID)
	if err := s.repo.CreateAddress(address); err != nil {
		return nil, err
	}
	return address, nil
}

func (s *Service) UpdateAddress(userID string, id string, input AddressInput) error {
	if err := validateAddress(input); err != nil {
		return err
	}
	return s.repo.UpdateAddress(userID, id, input.toModel(userID))
}

func (s *Service) DeleteAddress(userID string, id string) error {
	return s.repo.DeleteAddress(userID, id)
}

func (s *Service) SetDefaultAddress(userID string, id string) error {
	return s.repo.SetDefaultAddress(userID, id)
}

func validateAddress(input AddressInput) error {
	if input.ReceiverName == "" || input.ReceiverPhone == "" || input.Province == "" || input.City == "" || input.District == "" || input.DetailAddress == "" {
		return errors.New("address required fields missing")
	}
	return nil
}

func (input AddressInput) toModel(userID string) *UserAddress {
	return &UserAddress{
		UserID: userID,
		ReceiverName: input.ReceiverName,
		ReceiverPhone: input.ReceiverPhone,
		Province: input.Province,
		City: input.City,
		District: input.District,
		DetailAddress: input.DetailAddress,
		DoorNo: input.DoorNo,
		Longitude: input.Longitude,
		Latitude: input.Latitude,
		IsDefault: input.IsDefault,
	}
}
