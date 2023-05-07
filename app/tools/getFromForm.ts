export const getFromForm = (
  formData: FormData,
  ...fieldNames: string[]
): Record<string, string> => {
  return fieldNames.reduce(
    (pv, field) => Object.assign(pv, { [field]: formData.get(field) }),
    {}
  );
};

export default getFromForm;
