import React from "react";
import styled from "styled-components";

const Title = styled.td`
  background-color: #FFFFFF;
  font-size: 18px;
  border: 1px solid #444444;
  border-collapse: collapse;
`;

// const State = styled.td`
//   border: 1px solid #444444;
//   font-size: 18px;
//   border-collapse: collapse;
//   width: 10%;
// `;

const Url = styled.td`
  border: 1px solid #444444;
  font-size: 18px;
  border-collapse: collapse;
  width: 10%
`

const Table = styled.table`
  width: 100%;
  border: 1px solid #444444;
`;

class Contents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      isloaded: false,
    }
  }

  componentDidMount() {
    fetch('http://localhost:8000/api/posts/')
      .then(res => res.json())
      .then(
          (data) => {this.setState({
              isLoaded: true,
              data: data
          });
      },
    )
  }

  

    


  render() {
    const { data, isLoaded } = this.state;
    if (isLoaded) {
        return (
          <Table>
            <th>글 제목</th>
            <th>원글 주소</th>
            <th>업로드 날짜</th>
            {data.map(item => (
              <tr>
                <Title>{item.content.title}</Title>
                <Url><a href={item.content.url}>바로가기</a></Url>
                <Title>{item.content.date}</Title>
              </tr>
            )
        )}
        </Table>
      )
    } else {
      return <div>Loading...</div>
    }
  } 
}
export default Contents;