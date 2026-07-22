// Command networkproxy-agent activates one signed Network Tunnel offer on the edge host.
package main

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/megamen32/gptadmin/go-shellmcp/internal/networkproxy"
)

func main() {
	offerFile := flag.String("offer-file", "", "JSON file containing one signed Network Tunnel offer")
	flag.Parse()
	if *offerFile == "" {
		log.Fatal("-offer-file is required")
	}
	body, err := os.ReadFile(*offerFile)
	if err != nil {
		log.Fatalf("read offer: %v", err)
	}
	var offer networkproxy.Offer
	if err := json.Unmarshal(body, &offer); err != nil {
		log.Fatalf("decode offer: %v", err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err := networkproxy.RunOffer(ctx, offer); err != nil && ctx.Err() == nil {
		log.Fatalf("run network tunnel offer: %v", err)
	}
}
