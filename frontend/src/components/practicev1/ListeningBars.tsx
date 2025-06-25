import React from "react";

const ListeningBars: React.FC = () => (
  <span className="listening-animation flex items-end gap-1">
    {/* 7 bars, all purple */}
    <span className="bar bar1"></span>
    <span className="bar bar2"></span>
    <span className="bar bar3"></span>
    <span className="bar bar4"></span>
    <span className="bar bar5"></span>
    <span className="bar bar6"></span>
    <span className="bar bar7"></span>
  </span>
);

export default ListeningBars;
