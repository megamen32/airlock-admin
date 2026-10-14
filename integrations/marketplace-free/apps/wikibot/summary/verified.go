package summary

import "strings"

// This fixed demo asks for images from one immutable public compose file.
// Do not cache a generic proxy guess in place of its source-backed answer.
func verifiedComposeAnswer(answer string) bool {
	return strings.Contains(answer, "pgvector/pgvector:pg17") &&
		strings.Contains(answer, "caddy:2-alpine") &&
		strings.Contains(answer, "https://github.com/airlockrun/airlock/blob/e605529334a250d3158d546b5702c7651eb052c6/docker-compose.yml")
}
