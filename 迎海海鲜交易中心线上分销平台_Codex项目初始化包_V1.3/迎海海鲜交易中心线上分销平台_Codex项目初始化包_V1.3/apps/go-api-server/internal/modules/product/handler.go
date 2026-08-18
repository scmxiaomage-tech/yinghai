package product

import (
	"errors"
	"net/http"
	"strconv"

	"yinghai/go-api-server/internal/config"
	"yinghai/go-api-server/internal/middleware"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
	cfg config.Config
}

func NewHandler(service *Service, cfg config.Config) *Handler {
	return &Handler{service: service, cfg: cfg}
}

func (h *Handler) RegisterAppRoutes(group *gin.RouterGroup) {
	group.GET("/categories", h.AppCategories)
	group.GET("/products", h.AppProducts)
	group.GET("/products/recommended", h.AppRecommended)
	group.GET("/products/:id", h.AppProductDetail)
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.Use(middleware.JWTAuth(h.cfg))
	group.GET("/categories", h.AdminCategories)
	group.POST("/categories", h.CreateCategory)
	group.PUT("/categories/:id", h.UpdateCategory)
	group.DELETE("/categories/:id", h.DeleteCategory)
	group.GET("/products", h.AdminProducts)
	group.GET("/products/:id", h.AdminProductDetail)
	group.POST("/products", h.CreateProduct)
	group.PUT("/products/:id", h.UpdateProduct)
	group.POST("/products/:id/on-sale", h.OnSale)
	group.POST("/products/:id/off-sale", h.OffSale)
	group.POST("/products/:id/skus", h.CreateSKU)
	group.PUT("/skus/:id", h.UpdateSKU)
	group.DELETE("/skus/:id", h.DeleteSKU)
	group.POST("/products/:id/images", h.AddImage)
	group.DELETE("/product-images/:id", h.DeleteImage)
}

func (h *Handler) AppCategories(c *gin.Context) {
	items, err := h.service.ListCategories(false)
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, items)
}

func (h *Handler) AppProducts(c *gin.Context) {
	result, err := h.service.ListProducts(parseProductQuery(c, true, false))
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, result)
}

func (h *Handler) AppRecommended(c *gin.Context) {
	query := parseProductQuery(c, true, true)
	query.PageSize = 12
	result, err := h.service.ListProducts(query)
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, result.Items)
}

func (h *Handler) AppProductDetail(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	detail, err := h.service.ProductDetail(id, true)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, detail)
}

func (h *Handler) AdminCategories(c *gin.Context) {
	items, err := h.service.ListCategories(true)
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, items)
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var input CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.CreateCategory(input)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) UpdateCategory(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid category id")
		return
	}
	var input CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if err := h.service.UpdateCategory(id, input); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"updated": true})
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid category id")
		return
	}
	if err := h.service.DeleteCategory(id); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"deleted": true})
}

func (h *Handler) AdminProducts(c *gin.Context) {
	result, err := h.service.ListProducts(parseProductQuery(c, false, false))
	if err != nil {
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
		return
	}
	ok(c, result)
}

func (h *Handler) AdminProductDetail(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	detail, err := h.service.ProductDetail(id, false)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, detail)
}

func (h *Handler) CreateProduct(c *gin.Context) {
	var input ProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.CreateProduct(input)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) UpdateProduct(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	var input ProductInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if err := h.service.UpdateProduct(id, input); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"updated": true})
}

func (h *Handler) OnSale(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	if err := h.service.OnSale(id); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"shelfStatus": ProductShelfOnSale})
}

func (h *Handler) OffSale(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	if err := h.service.OffSale(id); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"shelfStatus": ProductShelfOffSale})
}

func (h *Handler) CreateSKU(c *gin.Context) {
	productID, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	var input SKUInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.CreateSKU(productID, input)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) UpdateSKU(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid sku id")
		return
	}
	var input SKUInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	if err := h.service.UpdateSKU(id, input); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"updated": true})
}

func (h *Handler) DeleteSKU(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid sku id")
		return
	}
	if err := h.service.DeleteSKU(id); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"deleted": true})
}

func (h *Handler) AddImage(c *gin.Context) {
	productID, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid product id")
		return
	}
	var input ImageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid request body")
		return
	}
	dto, err := h.service.AddImage(productID, input)
	if err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, dto)
}

func (h *Handler) DeleteImage(c *gin.Context) {
	id, okID := parseID(c.Param("id"))
	if !okID {
		fail(c, http.StatusBadRequest, "BAD_REQUEST", "invalid image id")
		return
	}
	if err := h.service.DeleteImage(id); err != nil {
		writeServiceError(c, err)
		return
	}
	ok(c, gin.H{"deleted": true})
}

func parseProductQuery(c *gin.Context, onlyOnSale bool, recommended bool) ProductQuery {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))
	query := ProductQuery{Keyword: c.Query("keyword"), Page: page, PageSize: pageSize, Sort: c.DefaultQuery("sort", "default"), OnlyOnSale: onlyOnSale, RecommendedOnly: recommended}
	if raw := c.Query("categoryId"); raw != "" {
		if id, err := strconv.ParseUint(raw, 10, 64); err == nil {
			query.CategoryID = &id
		}
	}
	return query
}

func parseID(raw string) (uint64, bool) {
	id, err := strconv.ParseUint(raw, 10, 64)
	return id, err == nil && id > 0
}

func writeServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrCategoryNotFound):
		fail(c, http.StatusNotFound, "CATEGORY_NOT_FOUND", "category not found")
	case errors.Is(err, ErrCategoryDisabled):
		fail(c, http.StatusBadRequest, "CATEGORY_DISABLED", "category disabled")
	case errors.Is(err, ErrCategoryHasProducts):
		fail(c, http.StatusBadRequest, "CATEGORY_HAS_PRODUCTS", "category has products")
	case errors.Is(err, ErrProductNotFound):
		fail(c, http.StatusNotFound, "PRODUCT_NOT_FOUND", "product not found")
	case errors.Is(err, ErrProductNotOnSale):
		fail(c, http.StatusNotFound, "PRODUCT_NOT_ON_SALE", "product not on sale")
	case errors.Is(err, ErrProductCannotOnSale):
		fail(c, http.StatusBadRequest, "PRODUCT_CANNOT_ON_SALE", "product cannot be on sale")
	case errors.Is(err, ErrSKUNotFound):
		fail(c, http.StatusNotFound, "SKU_NOT_FOUND", "sku not found")
	case errors.Is(err, ErrSKUPriceInvalid):
		fail(c, http.StatusBadRequest, "SKU_PRICE_INVALID", "sku price invalid")
	case errors.Is(err, ErrValidation):
		fail(c, http.StatusBadRequest, "VALIDATION_ERROR", "invalid request")
	default:
		fail(c, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}
}

func ok(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"code": "OK", "message": "success", "data": data, "requestId": c.GetString("requestId")})
}

func fail(c *gin.Context, status int, code string, message string) {
	c.JSON(status, gin.H{"code": code, "message": message, "requestId": c.GetString("requestId")})
}
