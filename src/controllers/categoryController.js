import Category from "../models/categoryModel.js";
import Device from "../models/deviceModel.js";

// @desc Create new category
// @route POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name, description });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all categories with stats
// @route GET /api/categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "devices",
          localField: "_id",
          foreignField: "categoryId",
          as: "devices"
        }
      },
      {
        $addFields: {
          total: { $size: "$devices" },
          inward: {
            $size: {
              $filter: {
                input: "$devices",
                as: "d",
                cond: { $eq: ["$$d.status", "inward"] }
              }
            }
          },
          outward: {
            $size: {
              $filter: {
                input: "$devices",
                as: "d",
                cond: { $eq: ["$$d.status", "outward"] }
              }
            }
          }
        }
      },
      {
        $project: {
          devices: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch categories with stats" });
  }
};

// @route GET /api/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.deleteOne();
    res.json({ message: "Category removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
