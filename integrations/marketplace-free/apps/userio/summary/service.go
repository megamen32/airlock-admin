package summary
import (
 "context"
 "crypto/sha256"
 "database/sql"
 "encoding/hex"
 "encoding/json"
 "errors"
 "io"
 "math"
 "strings"
 "time"
 "github.com/airlockrun/agentsdk"
)
type Input struct{}
type Result struct{
 Ready bool `json:"ready"`
 Subject string `json:"subject,omitempty"`
 Sender string `json:"sender,omitempty"`
 Recipient string `json:"recipient,omitempty"`
 Body string `json:"body,omitempty"`
 MessageAt string `json:"message_at,omitempty"`
 FetchedAt string `json:"fetched_at,omitempty"`
 Source string `json:"source"`
 Message string `json:"message"`
}
type Service struct{h *agentsdk.ConnectionHandle;db *agentsdk.AgentDB;busy chan struct{}}
func New(h *agentsdk.ConnectionHandle,db *agentsdk.AgentDB)*Service{return &Service{h,db,make(chan struct{},1)}}
var unavailable=errors.New("UserIO сейчас не подтвердил учебное письмо. Попробуйте прочитать его позже.")
func Parse(raw []byte)(Result,error){
 var v struct{ID string `json:"id"`;Source string `json:"source"`;Account string `json:"account_ref"`;Messages []struct{Source string `json:"source"`;ID string `json:"message_id"`;Sender string `json:"sender"`;Body string `json:"body"`;Direction string `json:"direction"`;At float64 `json:"received_at"`} `json:"messages"`}
 if len(raw)>64<<10||json.Unmarshal(raw,&v)!=nil||v.ID!=expectedConversationID||v.Source!=expectedAccountID||v.Account!=expectedAccountID{return Result{},unavailable}
 found:=false;var result Result
 for _,m:=range v.Messages{
  if m.ID!=expectedProviderMessageID{continue};if found{return Result{},unavailable};found=true
  hash:=sha256.Sum256([]byte(m.Body));if m.Source!=expectedAccountID||m.Sender!=expectedSender||m.Direction!="incoming"||hex.EncodeToString(hash[:])!=expectedBodySHA256||math.IsNaN(m.At)||math.IsInf(m.At,0)||m.At<=0||m.At>float64(time.Now().Add(time.Hour).Unix()){return Result{},unavailable}
  prefix:="Тема: "+expectedSubject+"\n\n";if !strings.HasPrefix(m.Body,prefix){return Result{},unavailable}
  result=Result{Ready:true,Subject:expectedSubject,Sender:m.Sender,Recipient:expectedRecipient,Body:strings.TrimPrefix(m.Body,prefix),MessageAt:time.Unix(int64(m.At),0).UTC().Format(time.RFC3339),Source:"UserIO API · отдельная учебная почта",Message:"UserIO прочитал настоящее учебное письмо из отдельного ящика. Новое письмо не отправлялось."}
 };if !found{return Result{},unavailable};return result,nil
}
func(s *Service)Tool(ctx context.Context,_ Input)(Result,error){r,e:=s.Get(ctx);if e!=nil{return Result{Source:"UserIO API",Message:e.Error()},nil};return r,nil}
func(s *Service)Get(ctx context.Context)(Result,error){
 select{case s.busy<-struct{}{}:defer func(){<-s.busy}();default:return Result{},errors.New("Учебное письмо уже загружается. Подождите несколько секунд.")}
 ctx,cancel:=context.WithTimeout(ctx,20*time.Second);defer cancel();var cached []byte
 e:=s.db.QueryRowContext(ctx,"SELECT payload FROM summary_cache WHERE id=1 AND fetched_at>NOW()-INTERVAL '5 minutes'").Scan(&cached)
 if e==nil{var r Result;if json.Unmarshal(cached,&r)!=nil||!r.Ready{return Result{},unavailable};return r,nil};if !errors.Is(e,sql.ErrNoRows){return Result{},unavailable}
 var used int;e=s.db.QueryRowContext(ctx,`INSERT INTO summary_quota(hour,used) VALUES(date_trunc('hour',NOW()),1) ON CONFLICT(hour) DO UPDATE SET used=summary_quota.used+1 WHERE summary_quota.used<12 RETURNING used`).Scan(&used)
 if errors.Is(e,sql.ErrNoRows){return Result{},errors.New("Демо-лимит чтений исчерпан. Попробуйте в следующем часу.")};if e!=nil{return Result{},unavailable}
 response,e:=s.h.RequestStream(ctx,agentsdk.RequestOpts{Method:"GET",Path:"/v1/conversations/"+expectedConversationID});if e!=nil{return Result{},unavailable};defer response.Body.Close();if response.StatusCode!=200{return Result{},unavailable}
 raw,e:=io.ReadAll(io.LimitReader(response.Body,(64<<10)+1));if e!=nil{return Result{},unavailable};r,e:=Parse(raw);if e!=nil{return Result{},e};r.FetchedAt=time.Now().UTC().Format(time.RFC3339);payload,e:=json.Marshal(r);if e!=nil{return Result{},unavailable}
 _,e=s.db.ExecContext(ctx,"INSERT INTO summary_cache(id,payload,fetched_at) VALUES(1,$1,NOW()) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,fetched_at=excluded.fetched_at",string(payload));if e!=nil{return Result{},unavailable};_,_=s.db.ExecContext(ctx,"DELETE FROM summary_quota WHERE hour<NOW()-INTERVAL '1 day'");return r,nil
}
