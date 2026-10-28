import pathlib,tarfile,json,zipfile,xml.sax.saxutils as esc,resource,hashlib,argparse,subprocess,os,urllib.request
resource.setrlimit(resource.RLIMIT_AS,(768<<20,768<<20));resource.setrlimit(resource.RLIMIT_CPU,(60,60))
parser=argparse.ArgumentParser(description="Generate small public Airlock code documents for the Wikibot free knowledge base; no credentials or private source.")
parser.add_argument('--output',type=pathlib.Path,required=True)
parser.add_argument('--revision',help='Public commit SHA; defaults to public main')
args=parser.parse_args();out=args.output;out.mkdir(parents=True,exist_ok=True)
sha=args.revision or subprocess.check_output(['git','-c','credential.helper=','ls-remote','https://github.com/airlockrun/airlock.git','refs/heads/main'],env={**os.environ,'GIT_TERMINAL_PROMPT':'0'},timeout=30,text=True).split()[0]
assert len(sha)==40 and all(c in '0123456789abcdef' for c in sha)
with urllib.request.urlopen('https://codeload.github.com/airlockrun/airlock/tar.gz/'+sha,timeout=60) as p:archive=p.read((32<<20)+1)
assert len(archive)<=32<<20
(out/'public-airlock.tar.gz').write_bytes(archive)
allowed={'.go','.ts','.tsx','.js','.jsx','.md','.sql','.proto','.yml','.yaml','.sh','.templ','.toml','.css'};excluded={'vendor','node_modules','.git','dist','build','gen'}
guide=set()
files=[]
with tarfile.open(out/'public-airlock.tar.gz') as t:
 for m in t.getmembers():
  if not m.isfile() or m.size>512<<10:continue
  p=pathlib.PurePosixPath(*pathlib.PurePosixPath(m.name).parts[1:])
  if set(p.parts)&excluded or p.parts[0]=='frontend' or (p.parts[0]=='db' and p.suffix=='.go') or p.name.endswith(('_test.go','.test.ts','.spec.ts')):continue
  if p.suffix not in allowed and p.name not in ['go.mod','Dockerfile','Makefile']:continue
  try:text=t.extractfile(m).read().decode()
  except UnicodeDecodeError:continue
  files.append((str(p),text))
files.sort();total=sum(len(s.encode()) for _,s in files);assert total<4_000_000
segments=[]
for name,text in files:
 if name in guide:continue
 lines=text.splitlines(keepends=True);chunk=[];size=0;first=1
 for n,line in enumerate(lines,1):
  assert len(line.encode())<75000,(name,n,'oversized line')
  if size+len(line.encode())>70000 and chunk:
   segments.append((name,first,n-1,''.join(chunk)));chunk=[];size=0;first=n
  chunk.append(line);size+=len(line.encode())
 if chunk:segments.append((name,first,len(lines),''.join(chunk)))
groups=[];g=[];size=0
for seg in segments:
 n=len(seg[3].encode())+500
 if g and size+n>78000:groups.append(g);g=[];size=0
 g.append(seg);size+=n
if g:groups.append(g)
content_types='<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'
def paragraph(s,heading=False):return '<w:p>'+('<w:pPr><w:pStyle w:val="Heading1"/></w:pPr>' if heading else '')+'<w:r><w:t xml:space="preserve">'+esc.escape(s)+'</w:t></w:r></w:p>'
docs=[]
for i,g in enumerate(groups,1):
 name=f'Airlock-code-{i:02d}-{sha[:12]}.docx';parts=[paragraph('Публичные исходники Airlock — часть '+str(i),True),paragraph('Первичный технический источник: https://github.com/airlockrun/airlock commit '+sha+'. Сайт airlockrun.ru — дополнительный продуктовый контекст. Это публичная версия, не Airlock Internal.')]
 for path,start,end,text in g:parts.extend([paragraph(f'ФАЙЛ {path}, строки {start}–{end}',True),paragraph(f'https://github.com/airlockrun/airlock/blob/{sha}/{path}#L{start}'),paragraph(text)])
 xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+''.join(parts)+'<w:sectPr/></w:body></w:document>'
 assert len(xml.encode())<130000
 with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as z:
  z.writestr('[Content_Types].xml',content_types);z.writestr('_rels/.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');z.writestr('word/document.xml',xml)
  z.writestr('word/styles.xml','<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style></w:styles>');z.writestr('word/_rels/document.xml.rels','<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
 docs.append({'document':name,'bytes':(out/name).stat().st_size,'sha256':hashlib.sha256((out/name).read_bytes()).hexdigest(),'paths':[s[0] for s in g]})
manifest={'repo':'https://github.com/airlockrun/airlock','commit':sha,'files':len(files),'textBytes':total,'documents':docs,'excluded':['tests','generated code','frontend','vendor','node_modules']}
(out/'public-code-parts-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('Public source',len(files),'files',total,'text bytes;',len(docs),'small documents')
