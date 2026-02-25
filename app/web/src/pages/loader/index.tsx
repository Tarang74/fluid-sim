import "./index.css";

export default function Loader({ loading }: { loading: boolean }) {
  return (
    <div className={`loader ${loading ? "visible" : "hidden"}`}>
      <div data-glitch="LOADING" className="glitch">
        LOADING
      </div>
    </div>
  );
}
