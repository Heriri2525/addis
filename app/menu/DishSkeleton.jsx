export default function DishSkeleton() {
  return (
    <div className="grid" aria-busy="true" data-testid="dish-skeleton">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="skel" />)}
    </div>
  );
}
