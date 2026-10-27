import DishCard from "./DishCard";

// SERVER component: pure markup from data, no hooks, no handlers, no directive.
// It ships zero JavaScript. Filtering is done by <FilterShell>, which wraps this
// component as {children} and hides cards using the data-category attribute set in DishCard.
export default function DishList({ dishes }) {
  return (
    <ul className="grid">
      {dishes.map((d) => (
        <DishCard key={d.id} dish={d} />
      ))}
    </ul>
  );
}
