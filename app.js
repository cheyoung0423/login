const express=require('express');
const app=express();
const bcrypt=require('bcrypt');
const session=require('express-session');
const mysql=require('mysql');
const path=require('path');
const sharp=require('sharp');

const multer=require('multer');
const hostname='localhost';



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // アップロード先のディレクトリ
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // ファイル名をユニークにする
    }
});
const upload = multer({ storage: storage,
                        limits:{fileSize:5*1024*1024}
 });
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(
    session({
      secret: 'my_secret_key',
      resave: false,
      saveUninitialized: false,
    })
  );
  app.use((req, res, next) => {
    if (req.session.userId === undefined) {
      res.locals.username = 'ゲスト';
      res.locals.isLoggedIn = false;
    } else {
      res.locals.username = req.session.username;
      res.locals.isLoggedIn = true;
    }
    next();
  });

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'rroott',	
    database: 'login'
  });


app.get('/article/:id',(req,res)=>{
const id=req.params.id;
connection.query(
    'SELECT*FROM articles WHERE id=? ',
[id],
(error,results)=>{
    res.render('article.ejs',{article:results[0]})
}
)


})
app.get('/submit',(req,res)=>{
    res.render('submit.ejs',{errors:[]});
}

)
app.get('/',(req,res)=>{
    connection.query(
        'SELECT * FROM articles',
        (error,results)=>{
            res.render('top.ejs',{articles:results});
        }
    );
});


app.post('/submit',upload.single('summary'),(req,res,next)=>{

const title=req.body.title;
const summary=req.file?req.file.path:'';
const content=req.body.content;

const errors=[];

if(title ===''){
    errors.push('タイトルがありません');
}
if(summary ===''){
    errors.push('画像がありません');
}
if(content===''){
    errors.push('投稿文がありません');

}
if(errors.length>0){
    res.render('submit.ejs',{errors:errors});
    
}

else{
    next();
}
},
    
    
    
    
    (req,res)=>{
    const title=req.body.title;
    const summary=req.file.path;
    const content=req.body.content;
    connection.query(
        'INSERT INTO articles(title,summary,content)VALUES(?,?,?)',
        [title,summary,content],
        (error,results)=>{
            res.redirect('/');
            
        }
    )
  
})

app.get('/login',(req,res)=>{
    res.render('login.ejs',{errors:[]})
})

app.post('/login',(req,res,next)=>{



 
    const email=req.body.email;
    const password=req.body.password;
    const errors=[];
    
     
    if(email ===''){
        
        errors.push('メールアドレスが入力されていません')
    }
    if(password ===''){
        errors.push('パスワードが入力されていません');
    }
    if(errors.length>0){
        res.render('login.ejs',{errors:errors});
    }else{
        next();
    }
    
    },
(req,res)=>{
    const email=req.body.email;
    connection.query(
        'SELECT * FROM blog WHERE email=?',
        [email],
        (error,results)=>{

            if (error) {
                console.error(error);
                return res.redirect('/login');
            }
            console.log(results); 
             
            if(results.length>0){
                const plain=req.body.password;
                const hash=results[0].password;

                bcrypt.compare(plain,hash,(error,isEqual)=>{
                    if (error) {
                        console.error(error); 
                        return res.redirect('/login'); 
                    }
                    
                    if(isEqual){
                        req.session.userId=results[0].id;
                        req.session.username=results[0].username;
                        res.redirect('/');
                    }else{
                        res.redirect('/login')
                       console.log('シッパイ')

                    }
                })

            }else{
                console.log('ユーザーが見つかりません');
                res.redirect('/login')
            }
        }
    );
})

app.get('/signup',(req,res)=>{
    res.render('signup.ejs',{errors:[]});
})

app.post('/signup',(req,res,next)=>{



const username=req.body.username;
const email=req.body.email;
const password=req.body.password;
const errors=[];

    if(username ===''){
        errors.push('ユーザー名が入力されていません');
    }
if(email ===''){
    
    errors.push('メールアドレスが入力されていません')
}
if(password ===''){
    errors.push('パスワードが入力されていません');
}
if(errors.length>0){
    res.render('signup.ejs',{errors:errors});
}else{
    next();
}

},
(req,res,next)=>{
    const email=req.body.email;
    const errors=[];
connection.query(
'SELECT * FROM blog WHERE email = ?',
[email],
(error,results)=>{
if(results.length>0){
    errors.push('ユーザー認証に失敗しました');
    res.render('signup.ejs',{errors:errors})
}else{
    next();
}
}
);
 
},
(req,res)=>{
    const username=req.body.username;
    const email=req.body.email;
    const password =req.body.password;
    
    bcrypt.hash(password,10,(error,hash)=>{
        connection.query(
            'INSERT INTO blog(username,email,password)VALUE(?,?,?)',
            [username,email,hash],
            (error,results)=>{
                req.session.userId=results.insertId;
                req.session.username=username;
                res.redirect('/');
            }
        )
    })
}
)
app.get('/logout',(req,res)=>{
    req.session.destroy((error)=>{
res.redirect('/');
    }

    );
});



app.listen(3001);