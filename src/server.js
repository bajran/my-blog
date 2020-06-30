import express from 'express';
import bodyParser from 'body-parser';
import MongoClient from 'mongodb'
import path from 'path';

const app = express();

//For build process - here the build folder is react project build 
app.use(express.static(path.join(__dirname, '/build')));

app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useUnifiedTopology: true });
        const db = client.db('my-blog');
        await operations(db)
        client.close()
    }
    catch (err) {
        res.status(500).json({ message: 'Error connecting to db', err });
    }
}

//Get Article By Name
app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const { name } = req.params;
        const articleInfo = await db.collection('articles').findOne({ name });
        res.status(200).json(articleInfo);
    }, res);
});


//Get Article Upvote
app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articleInfo.upvotes + 1
            }
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);
    }, res);
});


//Get Article Comment
app.post('/api/articles/:name/add-comment', (req, res) => {
    const articleName = req.params.name;
    const { username, text } = req.body;
    withDB(async (db) => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text })
            }
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);
    }, res)
})

//For Depolyment Process
app.get('*',(req, res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
})



app.listen(8000, () => {
    console.log('Listening on 8000');
})