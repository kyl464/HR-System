package handlers

import (
	"kkhris-clone/database"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetSchoolsMongo(c *gin.Context) {
	schools, err := database.GetSchoolsMongo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, schools)
}

func CreateSchoolMongo(c *gin.Context) {
	var input struct {
		Name    string `json:"name" binding:"required"`
		Level   string `json:"level" binding:"required"`
		Address string `json:"address"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	school := database.SchoolMongo{
		Name:    input.Name,
		Level:   input.Level,
		Address: input.Address,
	}

	created, err := database.CreateSchoolMongo(school)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}

func UpdateSchoolMongo(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		Name    string `json:"name" binding:"required"`
		Level   string `json:"level" binding:"required"`
		Address string `json:"address"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	school := database.SchoolMongo{
		Name:    input.Name,
		Level:   input.Level,
		Address: input.Address,
	}

	err := database.UpdateSchoolMongo(id, school)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "School updated"})
}

func DeleteSchoolMongo(c *gin.Context) {
	id := c.Param("id")

	err := database.DeleteSchoolMongo(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "School deleted"})
}
