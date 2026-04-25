import express from "express";

const router = express.Router({ mergeParams: true });

router.get("/", (req, res) => {
    return res.json({ message: "It works!" });
});

export default router;