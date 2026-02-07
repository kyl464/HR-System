package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
)

func GetEmployees(c *gin.Context) {
	search := c.Query("search")
	center := c.Query("center")

	var filtered []database.Employee
	for _, emp := range database.DB.Employees {
		matchesSearch := search == "" ||
			strings.Contains(strings.ToLower(emp.Name), strings.ToLower(search)) ||
			strings.Contains(strings.ToLower(emp.Roles), strings.ToLower(search))

		matchesCenter := center == "" || emp.Center == center

		if matchesSearch && matchesCenter {
			filtered = append(filtered, emp)
		}
	}

	c.JSON(http.StatusOK, filtered)
}

func GetEmployee(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	for _, emp := range database.DB.Employees {
		if emp.ID == uint(id) {
			c.JSON(http.StatusOK, emp)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
}
