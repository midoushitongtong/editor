import { Spinner } from 'react-bootstrap';
import './Loader.scss';

const Loader = () => {
  return (
    <div className="loader-container">
      <Spinner animation="grow" variant="primary" />
      <span className="loading-tooltip-text">加载中...</span>
    </div>
  );
};

export default Loader;
