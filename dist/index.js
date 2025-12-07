import express from "express";
import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "./generated/prisma/client.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const app = express();
const secret = "mylittleguy";
app.use(express.json());
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
import { signUpInput, signinInput, createPostInput, UpdatPostInput } from "@abhishekkalagurki/commonformedium";
app.post("/api/v1/user/signup", async (req, res) => {
    const body = await req.body;
    const { success } = signUpInput.safeParse(body);
    if (!success) {
        return res.json({ msg: "input validation error " });
    }
    console.log(body);
    const password = await bcrypt.hash(body.password, 10);
    console.log(password);
    const user = await prisma.user.create({
        data: {
            name: body.name,
            email: body.email,
            password: password
        }
    });
    // const user = await prisma.user.create({
    //     data : {
    //         name : body.name ,
    //         email : body.email , 
    //         password : password
    //     }
    // })
    console.log(user);
    const jwttoken = jwt.sign({ userId: user.id }, secret);
    return res.status(201).json({
        msg: "User created successfully",
        jwttoken
    });
});
app.post("/api/v1/user/signin", async (req, res) => {
    const body = req.body;
    console.log(body);
    const { success } = signinInput.safeParse(body);
    if (!success) {
        return res.json({ msg: "input validation error " });
    }
    const existingUser = await prisma.user.findUnique({
        where: {
            email: body.email
        }
    });
    if (!existingUser) {
        return res.status(403).json({
            error: "user not found"
        });
    }
    console.log(existingUser);
    const isValid = await bcrypt.compare(body.password, existingUser.password);
    if (!isValid) {
        return res.status(401).json({ error: "Password is not correct . erorr" });
    }
    const token = jwt.sign({ userId: existingUser.id }, secret);
    return res.status(201).json({
        token
    });
});
const auth = function (req, res, next) {
    const body = req.headers.authorization;
    if (!body) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded = jwt.verify(body, secret);
        console.log(decoded);
        if (!decoded.userId) {
            return res.status(401).json({ msg: "wrong jwttoken , cant access the endpoint" });
        }
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        return res.status(403).json({ error: "Invalid or expired token " });
    }
};
// middleware
app.post("/api/v1/blog", auth, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ msg: "ueser not qualified" });
    }
    const body = req.body;
    const { success } = createPostInput.safeParse(body);
    if (!success) {
        return res.json({ msg: "input validation error " });
    }
    console.log(typeof userId);
    const post = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: userId,
            published: true
        }
    });
    return res.status(201).json({
        msg: "post created",
        id: post.id
    });
});
app.put("/api/v1/blog", auth, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ msg: "ueser not qualified" });
    }
    const body = await req.body;
    const { success } = UpdatPostInput.safeParse(body);
    if (!success) {
        return res.json({ msg: "input validation error " });
    }
    const updatedpost = await prisma.post.update({
        where: {
            id: body.id,
            authorId: userId
        },
        data: {
            title: body.title,
            content: body.content
        }
    });
    console.log(updatedpost);
    return res.status(401).json({
        msg: "post was updated",
        id: updatedpost.id
    });
});
app.get("/api/v1/blog/bulk", auth, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ msg: "user has not published any blogs " });
    }
    console.log("inside the bulk endpoint");
    console.log(userId);
    const blogs = await prisma.post.findMany({});
    res.json(blogs);
});
// middleware
app.get("/api/v1/blog/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    console.log(id);
    const blog = await prisma.post.findUnique({
        where: {
            id: id
        }
    });
    console.log(blog);
    res.json(blog);
});
// middleware
app.listen(3000);
//# sourceMappingURL=index.js.map