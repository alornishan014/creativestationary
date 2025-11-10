# 🚀 Render.com এ Deployment করার নির্দেশিকা

এই গাইড আপনাকে Render.com এ আপনার Next.js প্রজেক্ট deploy করতে সাহায্য করবে।

## 📋 প্রয়োজনীয় প্রস্তুতি

1. **GitHub Repository**: আপনার কোড GitHub এ push করা থাকতে হবে
2. **Render.com Account**: [render.com](https://render.com) এ একটি ফ্রি অ্যাকাউন্ট তৈরি করুন

## 🔧 Deployment Steps

### Method 1: render.yaml ব্যবহার করে (Recommended)

1. **Render Dashboard এ যান**
   - [dashboard.render.com](https://dashboard.render.com) এ লগইন করুন

2. **New Web Service তৈরি করুন**
   - "New +" বাটনে ক্লিক করুন
   - "Web Service" নির্বাচন করুন
   - আপনার GitHub repository connect করুন

3. **Service Configuration**
   - **Name**: `creativestationary` (বা আপনার পছন্দমতো নাম)
   - **Environment**: `Node`
   - **Region**: আপনার নিকটতম region নির্বাচন করুন
   - **Branch**: `main` (বা আপনার default branch)
   - **Root Directory**: (খালি রাখুন, root directory থেকে deploy হবে)
   - **Build Command**: `npm install && npm run build && npx prisma db push`
   - **Start Command**: `npm start`

4. **Environment Variables যোগ করুন**
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (Render automatically generate করবে, অথবা আপনি manual set করতে পারেন)
   - `PORT` = (Render automatically set করবে, আপনার manually set করার দরকার নেই)

5. **Deploy করুন**
   - "Create Web Service" বাটনে ক্লিক করুন
   - Build process শুরু হবে (৫-১০ মিনিট লাগতে পারে)

### Method 2: Manual Configuration (render.yaml ছাড়া)

যদি render.yaml ব্যবহার করতে না চান, তাহলে Render Dashboard এ manually settings configure করুন:

**Build Command:**
```bash
npm install && npm run build && npx prisma db push
```

**Start Command:**
```bash
npm start
```

**Environment Variables:**
- `NODE_ENV` = `production`
- `DATABASE_URL` = `file:./db/custom.db` (SQLite এর জন্য)

## ⚠️ গুরুত্বপূর্ণ নোট

### SQLite Database সম্পর্কে

Render.com এ SQLite database ব্যবহার করার সময় কিছু সীমাবদ্ধতা আছে:

1. **Ephemeral Storage**: Render এর file system ephemeral, মানে restart হলে data হারাতে পারে
2. **Production এর জন্য**: Production environment এ PostgreSQL বা MySQL ব্যবহার করা ভালো

### Database Migration

প্রথম deployment এর সময় database automatically create হবে `prisma db push` command এর মাধ্যমে।

## 🔄 Auto-Deploy Setup

Render automatically আপনার GitHub repository এর main branch এ push হলে নতুন deployment শুরু করবে।

## 📝 Troubleshooting

### Build Error হলে:

1. **Build Logs চেক করুন**: Render Dashboard > Your Service > Logs
2. **Common Issues**:
   - Node version mismatch: `package.json` এ `engines` field যোগ করুন
   - Missing dependencies: `package.json` check করুন
   - Prisma errors: `prisma generate` command manually run করুন

### Runtime Error হলে:

1. **Runtime Logs চেক করুন**: Render Dashboard > Your Service > Logs
2. **Common Issues**:
   - Port binding error: `server.ts` এ PORT environment variable check করুন
   - Database connection: `DATABASE_URL` environment variable check করুন

## 🔐 Environment Variables Management

Render Dashboard এ:
1. Your Service > Environment tab এ যান
2. "Add Environment Variable" ক্লিক করুন
3. Key এবং Value যোগ করুন

## 📊 Monitoring

Deployment এর পর:
- **Logs**: Real-time logs দেখতে পারেন
- **Metrics**: CPU, Memory usage monitor করতে পারেন
- **Events**: Deployment history দেখতে পারেন

## 🎯 Next Steps

Deployment successful হলে:
1. আপনার app URL টি test করুন
2. Database connection verify করুন
3. Socket.IO connection test করুন (যদি ব্যবহার করেন)

## 💡 Tips

1. **Free Tier**: Render এর free tier এ ১৫ মিনিট inactivity এর পর service sleep mode এ চলে যায়
2. **Custom Domain**: Render Dashboard থেকে custom domain add করতে পারেন
3. **SSL**: Render automatically SSL certificate provide করে

---

## 🆘 Support

যদি কোনো সমস্যা হয়:
1. Render Dashboard এর Logs section check করুন
2. [Render Documentation](https://render.com/docs) দেখুন
3. [Render Community](https://community.render.com) এ প্রশ্ন করুন

---

**Happy Deploying! 🚀**

