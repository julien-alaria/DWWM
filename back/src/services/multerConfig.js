import multer from "multer"
import path from "path"
import AppError from "../utils/AppError.js"

// SECURITY: maps an ALLOWED mimetype to a fixed, safe extension.
const MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf"
}

// Storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // SECURITY: extension comes from the validated mimetype
        const ext = MIME_TO_EXT[file.mimetype] || ""

        // retrieve the email from the request, remove the special characters and spaces
        const userEmail = req.body.email
            ? req.body.email.replace(/[@.]/g, '-').toLowerCase()
            : "anonymous";

        // Result: picture-john-doe-gmail-com-17182938.png
        cb(null, `${file.fieldname}-${userEmail}-${uniqueSuffix}${ext}`);
    }
})

// Filter files: only allow real images/PDF, checked on BOTH the extension
// AND the declared mimetype, both fully anchored (^...$)
const ALLOWED_EXT = /^\.(jpe?g|png|webp|pdf)$/i
const ALLOWED_MIME = /^(image\/(jpeg|png|webp)|application\/pdf)$/i

// KNOWN LIMITATION: this filter trusts the mimetype declared by the
// client (multer/the browser), which is itself usually derived from
// the file's extension - not from its actual binary content. A plain
// text file renamed to ".jpg" will pass this check, because nothing
// here reads the real file bytes (the "magic bytes"/file signature).
// This does not allow code execution in this Node/Express setup (the
// file is only ever served statically via express.static), but a
// stricter version would verify the actual file signature after
// upload. Documented here as a deliberate trade-off for this project's
// risk level; left for future hardening if needed.
const fileFilter = (req, file, cb) => {
    const extName = ALLOWED_EXT.test(path.extname(file.originalname))
    const mimeType = ALLOWED_MIME.test(file.mimetype)

    if (extName && mimeType) {
        return cb(null, true)
    } else {
        cb(new AppError("Only images (jpeg, jpg, png, webp) and PDF are authorized"))
    }
}

// Initializing Multer with limits (e.g., max 5 MB per file)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo
})

// Wraps any Multer middleware (upload.single(...), upload.fields([...]))
// so that Multer-level errors (wrong format from fileFilter, file too
// large...) become AppError instances and flow through the app's
// central errorHandler, like any other expected error — instead of
// crashing to a generic 500.
export function withUploadErrors(multerMiddleware) {
    return (req, res, next) => {
        multerMiddleware(req, res, (err) => {
            if (err) {
                if (err instanceof AppError) {
                    return next(err)
                }
                if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                    return next(new AppError("File too large. Maximum allowed size is 5 MB."))
                }
                return next(new AppError(err.message || "Upload error"))
            }
            next()
        })
    }
}

export default upload