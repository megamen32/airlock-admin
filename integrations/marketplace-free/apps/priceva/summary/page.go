package summary

import (
	"encoding/json"
	"errors"
)

// Priceva omits objects when objects_cnt is explicitly zero (real report/list).
// Absence without that explicit count must never become an invented empty result.
func countPage(raw json.RawMessage) (int, error) {
	bad := errors.New("unconfirmed Priceva page")
	var page struct {
		Count   *int            `json:"objects_cnt"`
		Objects json.RawMessage `json:"objects"`
	}
	if json.Unmarshal(raw, &page) != nil || page.Count == nil || *page.Count < 0 {
		return 0, bad
	}
	if len(page.Objects) == 0 || string(page.Objects) == "null" {
		if *page.Count == 0 {
			return 0, nil
		}
		return 0, bad
	}
	var items []json.RawMessage
	count := 0
	if json.Unmarshal(page.Objects, &items) == nil {
		count = len(items)
	} else {
		var objectMap map[string]json.RawMessage
		if json.Unmarshal(page.Objects, &objectMap) != nil {
			return 0, bad
		}
		count = len(objectMap)
	}
	if count > *page.Count || (*page.Count > 0 && count == 0) {
		return 0, bad
	}
	return count, nil
}
