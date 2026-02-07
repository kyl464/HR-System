package handlers

import (
	"net/http"
	"strconv"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
)

func GetAwards(c *gin.Context) {
	quarter := c.Query("quarter")
	yearStr := c.Query("year")

	var filtered []database.Award
	for _, award := range database.DB.Awards {
		matchesQuarter := quarter == "" || award.Quarter == quarter
		matchesYear := yearStr == ""
		if yearStr != "" {
			year, _ := strconv.Atoi(yearStr)
			matchesYear = award.Year == year
		}

		if matchesQuarter && matchesYear {
			filtered = append(filtered, award)
		}
	}

	c.JSON(http.StatusOK, filtered)
}
