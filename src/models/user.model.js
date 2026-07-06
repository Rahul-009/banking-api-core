import mongoose from "mongoose"
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [ true, "Email is required for creating a user" ],
        trim: true,
        lowercase: true,
        match: [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address" ],
        unique: [ true, "Email already exists." ]
    },
    password: {
        type: String,
        required: [ true, "Password is required for creating an account" ],
        minlength: [ 6, "password should contain more than 6 character" ],
        select: false
    },
    name: {
        type: String,
        required: [ true, "Name is required for creating an account" ]
    },

    firstName: {
        type: String,
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"]
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"]
    },

    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-]{10,15}$/, "Please enter a valid phone number"]
    },

    // Address Information
    address: {
        street: {
            type: String,
            trim: true,
            maxlength: [200, "Street address cannot exceed 200 characters"]
        },
        city: {
            type: String,
            trim: true,
            maxlength: [100, "City cannot exceed 100 characters"]
        },
        state: {
            type: String,
            trim: true,
            maxlength: [100, "State cannot exceed 100 characters"]
        },
        zipCode: {
            type: String,
            trim: true,
            match: [/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"]
        },
        country: {
            type: String,
            trim: true,
            default: "USA",
            maxlength: [100, "Country cannot exceed 100 characters"]
        }
    },

    // Demographic Information
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(value) {
                if (!value) return true
                const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                return age >= 18
            },
            message: "You must be at least 18 years old"
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'],
        default: 'prefer-not-to-say'
    },
    
    // Professional Information
    occupation: {
        type: String,
        trim: true,
        maxlength: [100, "Occupation cannot exceed 100 characters"]
    },
    employer: {
        type: String,
        trim: true,
        maxlength: [100, "Employer cannot exceed 100 characters"]
    },
    annualIncome: {
        type: Number,
        min: [0, "Annual income cannot be negative"]
    },

    // Profile Media
    profilePicture: {
        type: String, // URL to uploaded image
        default: null
    },

    // ========== SECURITY & VERIFICATION ==========
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    
    // ========== ACCOUNT METADATA ==========
    lastLogin: {
        type: Date,
        default: null
    },
    lastLoginIP: {
        type: String,
        select: false
    },
    loginAttempts: {
        type: Number,
        default: 0,
        min: [0, "Login attempts cannot be negative"]
    },
    lockedUntil: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletedAt: { 
        type: Date, 
        default: null 
    },

    profileCompletion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
    
}, {
    timestamps: true
})

// ========== MIDDLEWARE ==========
userSchema.pre("save", async function(){
    // hash password
    if(!this.isModified("password")){
        return
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash
    
    // normalize email
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase().trim();
    }

    // Calculate profile completion
    this.profileCompletion = this.calculateProfileCompletion()

    return
})

// Query middleware - exclude soft-deleted
userSchema.pre(/^find/, function() {
    this.where({ isActive: true, deletedAt: null });
});

// ========== INSTANCE METHODS ==========
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.incrementLoginAttempts = async function() {
    this.loginAttempts += 1;
    
    // Lock after 5 failed attempts
    if (this.loginAttempts >= 5) {
        this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    await this.save();
};

userSchema.methods.resetLoginAttempts = async function() {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    await this.save();
};

userSchema.methods.calculateProfileCompletion = function() {
    const fields = [
        this.firstName,
        this.lastName,
        this.phone,
        this.address?.street,
        this.address?.city,
        this.address?.zipCode,
        this.dateOfBirth,
        this.profilePicture,
        this.occupation
    ]
    
    const filled = fields.filter(field => field && field !== '').length
    return Math.round((filled / fields.length) * 100)
}

userSchema.methods.softDelete = async function() {
    this.isActive = false;
    this.deletedAt = new Date();
    await this.save();
};

userSchema.methods.restore = async function() {
    this.isActive = true;
    this.deletedAt = null;
    await this.save();
};


// ========== VIRTUAL FIELDS ==========
userSchema.virtual('fullName').get(function() {
    if (this.firstName && this.lastName) {
        return `${this.firstName} ${this.lastName}`.trim()
    }
    return this.name || ''
})

userSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null
    return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
})

userSchema.virtual('isAccountLocked').get(function() {
    return this.lockedUntil && this.lockedUntil > new Date()
})

// ========== STATIC METHODS ==========
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() })
}

userSchema.statics.findActive = function() {
    return this.find({ isActive: true })
}

// removes sensitive fields in response
userSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.twoFactorSecret;
        delete ret.lastLoginIP;
        return ret;
    }
});

// ========== Indexes ==========
userSchema.index({ phone: 1 });
userSchema.index({ isActive: 1, createdAt: -1 });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });


const userModel = mongoose.model("user", userSchema)
export default userModel