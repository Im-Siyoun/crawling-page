import React from 'react';
import styled from "styled-components";
import Contents from "./content";

class Main extends React.Component {
  constructor(props) {
    super(props);
  }
    
  render() {
    return (
      <div class='content'>
        <Contents/>
      </div>
    )
  }
}


export default Main;