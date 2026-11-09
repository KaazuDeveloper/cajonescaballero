import { ObjectId } from "mongodb";
import conexionDB from "../mongodb_conector.js";

/**
 * Productos
 */

export const getProductos=async(req, res)=>{
    try {
        const database = await conexionDB();
        const collection = database.collection("productos"); 
        const result = await collection.find({}).toArray();
        res.status(200).json(result); 
    } catch (error) {
        res.status(500).json({
            message:"Error en el servidor"
        })
    }
};

export const addProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, marca_id, stock, imagen_url, categoria } = req.body;

        // Validar los campos requeridos
        if (!nombre || !descripcion || !precio || !marca_id || !stock || !imagen_url || !categoria) {
            return res.status(400).json({ message: "Todos los campos son requeridos" });
        }

        // Establecer la fecha de lanzamiento a la fecha actual
        const fecha_lanzamiento = new Date();

        const database = await conexionDB();
        const collection = database.collection("productos");

        // Crear el nuevo producto
        const nuevoProducto = {
            nombre,
            descripcion,
            precio: parseFloat(precio),
            marca_id: new ObjectId(marca_id),
            stock: parseInt(stock),
            imagen_url,
            categoria,
            fecha_lanzamiento
        };

        // Insertar el nuevo producto en la base de datos
        const result = await collection.insertOne(nuevoProducto);

        res.status(200).json({ id: result.insertedId, message: "Producto agregado correctamente" });
    } catch (error) {
        console.error("Error al agregar el producto:", error);
        res.status(500).json({
            message: "Error en el servidor"
        });
    }
};