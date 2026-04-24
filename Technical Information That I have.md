# Technical Store That I have
I do have some technical tools that you can use for the projects, to build the workflows, automations, apps and outputs better. Read this file before starting to any project, understand what technical tools we have and compare them with the requirements of the project. Then suggest me which tools we can use for this particular project, or which other tools we might get to create a better end result. 

## Oracle VPS 
- I have an Oracle VPS, where I run several apps and databases. 
- Account details can be seen here: ssh -i ~/Downloads/ssh-key-2025-11-29.key ubuntu@140.245.209.173

## Docker
- I run Docker in my Oracle VPS. 

## n8n
- I run n8n in my oracle vps through docker. the n8n automations are in https://ai.okare.tr . n8n is mcp enabled

## supabase
Oracle Cloud üzerinde database için supabase kurulu.
- Oracle Cloud üzerinde kurduğum SUPABASE için 
Password: POOkare.2023*
JWT_SECRET=Okare2026!JWT#Secret$Key&Supabase@Secure  
ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQxODI0MDAwLCJleHAiOjE4OTk1OTA0MDB9.QdF0i8Vr9y0d3IKvQ7D7KObA56ioYeBpQSMMDYWxcbg
SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NDE4MjQwMDAsImV4cCI6MTg5OTU5MDQwMH0.rUrzWF-S7jBDPfoC9eDdmYxY5N20KG2tAHQ6lQHurKE


Supabase’a bağlanmak için:  
supabase.okare.tr
username: supabase
Password: SUOkare.2023*
ubuntu@okarecloud:~$ grep "DASHBOARD_USERNAME\|DASHBOARD_PASSWORD" /home/ubuntu/supabase/supabase/docker/.env
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=SUOkare.2023*

## Pocketbase:
Oracle Cloud üzerinde daha basit database uygulamaları için pocketbase kurulu. Pocketbase için credentials elimde yok. 

## Cloudflare 
Bütün domain'lerim Cloudflare üzerinden CDN servisi alıyor. 

## Cloudflare Tunnel
uygulamalarım cloudflare tunnel üzerinden kullanıyorum. Bununla ilgili credentials'larım bu dosyada değilse elimde yok demektir. 

## Cloudflare R2 Object Storage
Public URL üzerinden medya alması gereken sosyal medya uygulamaları için CLoudflare R2 object storage kurdum. Credential'lar bu dosyada bulunabilir. 

## Github
Projelerimizi kaybetmemek ve gelişimlerini kontrol altına almak üzere github'a push ediyoruz. Github bağlantım https://github.com/tgurses74 . Bütün projelerimizi deployment sonrası github'a push ediyoruz. daha öncesinde worktree'ler ile çalışmak gerekirse bunun için de beni yönlendirmeni isterim. 

## Vercel
Projelerimizi deploy etmek için Vercel'den yararlanıyoruz. #### !!! Bütün projelerimizi vercel'de deploy etmek zorunda değiliz , Vercel sadece kullanabileceğimiz bir araç !!! account detail: https://vercel.com/okareefls-projects



# Social Media Automation — Project Credentials
## ⚠️ CONFIDENTIAL — Keep this file secure and do not share
## These credentials and other information is general, Take only whichever information is necessary for you, do not try to use non-necessary information from this list. 


---

## n8n Instance
| Item | Value |
|---|---|
| **URL** | `https://ai.okare.tr` |
| **Server** | Oracle Cloud Ubuntu — IP: `140.245.209.173` |
| **Tunnel** | Cloudflare Tunnel |

---

## Workflow IDs
| Workflow | ID |
|---|---|
| Workflow 1 — Morning Scheduler | `uvxabHsjRlqw5gg4` |
| Workflow 2 — Gmail Reply Poller | `Kto797YDEGJSy6Jm` |
| Workflow 3 — Publisher | `I5U71lhyNuuVbtOk` |
| Workflow 4 — Video Server | *(check n8n dashboard)* |

---

## n8n Credential IDs
| Credential | ID | Name |
|---|---|---|
| Google Sheets OAuth2 | `xlhmwe2x0g1g2e39` | Google Sheets account |
| Gmail OAuth2 | `LA8h1995ue2mojT2` | Gmail account Credentials |
| Google Drive OAuth2 | `jcyw2vpGWQtvb25E` | Google Drive account |

---

## Google Services
| Item | Value |
|---|---|
| **Admin Gmail** | `okareefl@gmail.com` |
| **Manager Gmail** | `tolga.gurses@gmail.com` |
| **Google Sheet ID** | `1xT3gqFgLhvHXsYqYNTpCZN8LW-41ctMfjG1sYk3Zgjs` |
| **Sheet Tab Name** | `SOSYAL MEDYA POST TAKVİMİ` |
| **Sheet Header Row** | `3` |
| **Sheet First Data Row** | `4` |
| **Google Drive Folder ID** | `1B6XWY-DzlU6miq464GEaswgiMJlUSXsO` |

---

## Gmail Labels
| Label | ID |
|---|---|
| `n8n-pending` | `Label_3528480063802992955` |
| `n8n-approval` | `Label_7352858134472822780` |

---

## Gemini API
| Item | Value |
|---|---|
| **API Key** | `AIzaSyDRhXswriqwgXYqvD9dVKHWQHbDk-E2rzk` |
| **Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` |

---

## Facebook & Instagram (Meta Graph API)
| Item | Value |
|---|---|
| **Bearer Token** | `EAAYSktpEe8UBRBjxLMExXWrfmupC3P1ZB6ZAL7KdqtdUzsiTvMRSn3IUYSCeShZBbAWfbJp6ClQiY7ZBks1SUSs1Vka53OixdrQuy9jhNiMz00nIlYJB8583WtdxszpQ04ZA4j2E65DYGaUehFAw0khzjjhNCFm8eC7YrUYpkUdW8aH34Mig6MZBxWRBwys9sLbISzKdgT` |
| **Facebook Page ID** | `906298612797307` |
| **Instagram Account ID** | `17841405392091501` |
| **API Version** | `v25.0` |

---

## Cloudflare R2 Object Storage
| Item | Value |
|---|---|
| **Account ID** | `9d30fb14924ce3fe0f04f76c3c4aabf8` |
| **Bucket Name** | `openborders-media` |
| **Access Key ID** | `69b4d827012c6a41a2f07c1db19a4c72` |
| **Secret Access Key** | `2ae494ebaf5ca9ecb74ebbaba00a8bcc968ed53a8d7656fb3f31935c3cd2c837` |
| **Endpoint URL** | `https://9d30fb14924ce3fe0f04f76c3c4aabf8.r2.cloudflarestorage.com` |
| **Public URL** | `https://media.okare.tr` |
| **Region** | `auto` |

---

## API Endpoints Reference
| Service | Endpoint |
|---|---|
| IG Create Media Container | `POST https://graph.facebook.com/v25.0/17841405392091501/media` |
| IG Publish Media | `POST https://graph.facebook.com/v25.0/17841405392091501/media_publish` |
| IG Poll Status | `GET https://graph.facebook.com/v25.0/{container_id}?fields=status_code,status` |
| FB Publish Photo | `POST https://graph.facebook.com/v25.0/906298612797307/photos` |
| FB Publish Video | `POST https://graph.facebook.com/v25.0/906298612797307/videos` |
| n8n Video Webhook | `GET https://ai.okare.tr/webhook/serve-video?fileId={FILEID}` |

---

## Notes
- Meta Bearer Token expires periodically — regenerate at [Meta Business Manager](https://business.facebook.com) when posts start failing with auth errors
- Gemini API key is linked to the okareefl@gmail.com Google Cloud project
- R2 credentials do not expire unless manually rotated
- Google OAuth credentials (Sheets, Gmail, Drive) are linked to okareefl@gmail.com and require re-authorization if revoked

-----
## TikTok Credentials
- Tiktok app name : Social Media Automation 
- client key |  'aw0j7utrt7fc2j6d' |
- client secret | '98hyOl8wSvoUzY2jMoQlg6eXuunNM9hB' |
- tiktok  developers page: https://developers.tiktok.com/app/7630001847608117255/pending 


------
## Google Gemini API Key
Project Name: projects/137380955648
API Key: AIzaSyDRhXswriqwgXYqvD9dVKHWQHbDk-E2rzk


_________
### Gmail App Password
Password: wqhgyypkzzvkxttd

-------------
#### CRON_SECRET
CRON_SECRET: ece8718d621e9586ce43f13e3d24434c


---------------
#### VERCEL CREDENTIALS
VITE_SUPABASE_URL	https://supabase-social.okare.tr
VITE_SUPABASE_ANON_KEY	eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzQ0NDgzMjAwLCJleHAiOjIwNTk4NDMyMDB9.VJ14C-nIiB8oFZLX0heRbeCAP64ENVQPhrA966LLLAo
INTERNAL_API_KEY: 5b76307c3904573b2f4563a356881fcdbef3b86ccdbb47e49871e9425d1d9e4e
RESEND_API_KEY	Skip for now