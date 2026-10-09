package main

import (
	"agent/bridgeauth"
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/airlockrun/agentsdk"
)

func (a *application) ensureRuntimeBudget(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	user, _ := agentsdk.CallerFromContext(ctx).User()
	key, err := a.uiKey.Get(ctx)
	if err != nil || a.config.UIURL == "" {
		return errors.New("Runtime budget unavailable")
	}
	assertion, err := bridgeauth.Sign(bridgeauth.Claims{AppID: a.config.AgentID, UserID: user.ID, Email: user.Email, Role: "admin", Host: a.config.Slug + ".airlock.bezrabotnyi.com", Method: "POST", URI: "/__airlock_budget", Expires: time.Now().Add(30 * time.Second).Unix()}, key)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", strings.TrimRight(a.config.UIURL, "/")+"/__airlock_budget", nil)
	if err != nil {
		return errors.New("Runtime budget unavailable")
	}
	req.Header.Set(bridgeauth.Header, assertion)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return errors.New("Runtime budget unavailable")
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		return errors.New("Runtime budget not confirmed")
	}
	return nil
}
