package summary
import("encoding/json";"os";"strings";"testing")
func TestActualHerderAdmissionEnvelope(t *testing.T){raw,e:=os.ReadFile("testdata/actual-herder-admission.json");if e!=nil{t.Fatal(e)};v,e:=unwrap(raw);if e!=nil{t.Fatal(e)};var a struct{OK bool `json:"ok"`;SID string `json:"sessionId"`};if json.Unmarshal(v,&a)!=nil||!a.OK||a.SID!="fast-agent:2610150819-8UgoSO"{t.Fatalf("lost actual receipt: %s",v)}}
func TestChildErrorCannotBecomeSuccessfulAdmission(t *testing.T){if _,e:=unwrap([]byte(`{"status":"completed","response":{"isError":true,"content":[{"type":"text","text":"{}"}]}}`));e==nil{t.Fatal("child error accepted")}}
func TestWorkspacesAreStableAndDistinct(t *testing.T){a,b:=nameFor("guest-a"),nameFor("guest-b");if a!=nameFor("guest-a")||a==b||strings.ContainsAny(workspace(a),"'\";\\\n"){t.Fatal("unsafe or shared workspace")};if _,e:=task("arbitrary-command");e==nil{t.Fatal("unlisted task accepted")}}
