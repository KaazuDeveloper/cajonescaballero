import { ObjectId } from "mongodb";
import conexionDB from "../mongodb_conector.js";

/**
 * Usuarios
 */

export const getComentarios=async(req, res)=>{
    try {
        const database = await conexionDB();
        const collection = database.collection("comentarios"); 
        const result = await collection.find({}).toArray();
        res.status(200).json(result); 
    } catch (error) {
        res.status(500).json({
            message:"Error en el servidor"
        })
    }
};

export const getComentariosProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const database = await conexionDB();
        const collection = database.collection("comentarios");

        const result = await collection.find({
            producto_id: new ObjectId(id),
        }).sort({ fecha: -1 }).toArray();

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            message: "Error en el servidor"
        });
    }
};

export const addComentario = async (req, res) => {
    try {
        const { producto_id, texto } = req.body;
        if (typeof texto !== "string" || !texto.trim() || texto.length > 1000 || !ObjectId.isValid(producto_id)) {
            return res.status(400).json({ message: "Comentario no válido" });
        }
        const database = await conexionDB();
        const result = await database.collection("comentarios").insertOne({
            usuario_id: new ObjectId(req.usuario.sub),
            producto_id: new ObjectId(producto_id),
            texto: texto.trim(),
            fecha: new Date(),
            nombreUsuario: req.usuario.nombre,
        });
        res.status(201).json({ id: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};

export const deleteComentario = async (req, res) => {
    try {
        const { id } = req.params;
        const database = await conexionDB();
        const collection = database.collection("comentarios");
        
        const result = await collection.deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: "Comentario eliminado" });
        } else {
            res.status(404).json({ message: "Comentario no encontrado" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error en el servidor"
        });
    }
};
