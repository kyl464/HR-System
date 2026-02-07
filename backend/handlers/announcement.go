package handlers

import (
	"net/http"

	"kkhris-clone/database"

	"github.com/gin-gonic/gin"
)

func GetAnnouncements(c *gin.Context) {
	var active []database.Announcement
	for _, ann := range database.DB.Announcements {
		if ann.IsActive {
			active = append(active, ann)
		}
	}
	c.JSON(http.StatusOK, active)
}
