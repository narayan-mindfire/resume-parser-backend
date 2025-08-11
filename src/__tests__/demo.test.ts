describe("Example Test Suite", () => {
  it("should add numbers correctly", () => {
    const sum = 2 + 3;
    expect(sum).toBe(5);
  });

  it("should match object structure", () => {
    const user = { name: "Narayan", active: true };
    expect(user).toMatchObject({ name: "Narayan" });
  });
});
