package auth

import (
	"errors"
	"fmt"
	"time"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/modules/user"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type Service struct {
	cfg config.Config
	users *user.Repository
}

type WechatLoginInput struct {
	Code string `json:"code"`
	MockOpenID string `json:"mockOpenId,omitempty"`
	Nickname string `json:"nickname,omitempty"`
	AvatarURL string `json:"avatarUrl,omitempty"`
	DeviceID string `json:"deviceId,omitempty"`
	IP string
	UserAgent string
}

type LoginResult struct {
	Token string `json:"token"`
	TokenType string `json:"tokenType"`
	ExpiresIn int `json:"expiresIn"`
	User *user.User `json:"user"`
}

func NewService(cfg config.Config, users *user.Repository) *Service {
	return &Service{cfg: cfg, users: users}
}

func (s *Service) WechatLogin(input WechatLoginInput) (*LoginResult, error) {
	if input.Code == "" {
		return nil, errors.New("code is required")
	}

	openID, err := s.resolveWechatOpenID(input)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	var current *user.User
	err = s.users.DB().Transaction(func(tx *gorm.DB) error {
		existing, findErr := s.users.FindByOpenID(openID)
		if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
			return findErr
		}
		if existing == nil {
			created := &user.User{
				OpenID: openID,
				Status: "active",
				LastLoginAt: &now,
			}
			profile := &user.UserProfile{}
			if input.Nickname != "" {
				profile.Nickname = &input.Nickname
			}
			if input.AvatarURL != "" {
				profile.AvatarURL = &input.AvatarURL
			}
			if err := s.users.CreateUserWithProfile(tx, created, profile); err != nil {
				return err
			}
			current = created
		} else {
			current = existing
			if err := s.users.TouchLogin(tx, existing.ID, now); err != nil {
				return err
			}
		}

		record := &user.UserLoginRecord{
			UserID: current.ID,
			LoginType: "wechat",
			LoginAt: now,
		}
		if input.IP != "" {
			record.IP = &input.IP
		}
		if input.UserAgent != "" {
			record.UserAgent = &input.UserAgent
		}
		if input.DeviceID != "" {
			record.DeviceID = &input.DeviceID
		}
		return s.users.CreateLoginRecord(tx, record)
	})
	if err != nil {
		return nil, err
	}

	token, err := s.SignToken(current.ID, "app_user")
	if err != nil {
		return nil, err
	}
	loaded, err := s.users.FindByID(current.ID)
	if err == nil {
		current = loaded
	}
	return &LoginResult{
		Token: token,
		TokenType: "Bearer",
		ExpiresIn: s.cfg.JWTExpiresMinutes * 60,
		User: current,
	}, nil
}

func (s *Service) SignToken(userID string, role string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"userId": userID,
		"role": role,
		"iss": s.cfg.JWTIssuer,
		"iat": now.Unix(),
		"exp": now.Add(time.Duration(s.cfg.JWTExpiresMinutes) * time.Minute).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

func (s *Service) resolveWechatOpenID(input WechatLoginInput) (string, error) {
	if s.cfg.WechatLoginMock {
		if input.MockOpenID != "" {
			return input.MockOpenID, nil
		}
		return fmt.Sprintf("mock_openid_%s", input.Code), nil
	}
	return "", errors.New("wechat code2session is not configured in R1 local mode")
}
