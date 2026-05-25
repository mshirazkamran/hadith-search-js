import mongoose from "mongoose";
import argon2 from "argon2";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    is_verified: {
      type: Boolean,
      default: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password_hash")) return;
  this.password_hash = await argon2.hash(this.password_hash);
});

userSchema.methods.verifyPassword = function (plainPassword) {
  return argon2.verify(this.password_hash, plainPassword);
};

const User = mongoose.model("User", userSchema);
export default User;
