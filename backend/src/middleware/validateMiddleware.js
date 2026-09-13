const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      console.error(
        "Validation error:",
        result.error.issues
      );

      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // Only replace body when the schema actually
    // contains a body object.
    if (result.data.body) {
      req.body = result.data.body;
    }

    next();
  };
};

export default validate;