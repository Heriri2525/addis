import DishSkeleton from "./DishSkeleton";

// Page slot while the segment loads. The layout (sidebar) is NOT replaced.
export default function Loading() {
  return (
    <section aria-busy="true">
      <h1>Menu</h1>
      <DishSkeleton />
    </section>
  );
}
