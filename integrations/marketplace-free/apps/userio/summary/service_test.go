package summary
import("encoding/json";"os";"strings";"testing")
func fixture(t *testing.T)[]byte{t.Helper();b,e:=os.ReadFile("testdata/training-receipt.json");if e!=nil{t.Fatal(e)};return b}
func TestTrainingReceipt(t *testing.T){r,e:=Parse(fixture(t));if e!=nil||!r.Ready||r.Subject!=expectedSubject||r.Sender!=expectedSender||!strings.Contains(r.Body,"AIRLOCK-MAIL-001"){t.Fatal("actual receipt not parsed",e)}}
func TestForeignAndChangedMessageRejected(t *testing.T){
 for _,mutate:=range []func(map[string]any){
  func(v map[string]any){v["account_ref"]="other-account"},
  func(v map[string]any){v["id"]="other-conversation"},
  func(v map[string]any){v["source"]="other-source"},
  func(v map[string]any){v["messages"].([]any)[0].(map[string]any)["body"]="Подменённое письмо"},
  func(v map[string]any){v["messages"].([]any)[0].(map[string]any)["sender"]="other@example.org"},
  func(v map[string]any){v["messages"].([]any)[0].(map[string]any)["message_id"]="other-message"},
  func(v map[string]any){v["messages"].([]any)[0].(map[string]any)["direction"]="outgoing"},
  func(v map[string]any){v["messages"].([]any)[0].(map[string]any)["received_at"]=0},
  func(v map[string]any){v["messages"]=append(v["messages"].([]any),v["messages"].([]any)[0])},
 }{var v map[string]any;if e:=json.Unmarshal(fixture(t),&v);e!=nil{t.Fatal(e)};mutate(v);raw,_:=json.Marshal(v);if r,e:=Parse(raw);e==nil||r.Ready{t.Fatal("foreign/changed receipt accepted")}}
 for _,b:=range [][]byte{nil,[]byte("{}"),[]byte(strings.Repeat("x",(64<<10)+1))}{if _,e:=Parse(b);e==nil{t.Fatal("invalid response accepted")}}
}
func TestOtherMessagesNotExposed(t *testing.T){var v map[string]any;json.Unmarshal(fixture(t),&v);v["messages"]=append(v["messages"].([]any),map[string]any{"message_id":"different","body":"PRIVATE-UNKNOWN-TEXT"});b,_:=json.Marshal(v);r,e:=Parse(b);if e!=nil||strings.Contains(r.Body,"PRIVATE-UNKNOWN-TEXT"){t.Fatal("unselected message exposed")}}
