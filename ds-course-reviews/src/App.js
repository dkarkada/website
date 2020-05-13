import React from 'react';
import './App.css';

function Review(props){
  return (
    <div className="Review">
      <h3>{props.coursenum} {props.coursename}</h3>
      <h3>{props.prof}, {props.date}</h3>
      <h4>Reviewer: {props.reviewer}</h4>
      <h4>Difficulty</h4>
      <p>{props.difficulty}</p>
      <h4>Workload</h4>
      <p>{props.workload}</p>
      <h4>Lectures</h4>
      <p>{props.lecture}</p>
      <h4>Miscellaneous</h4>
      <p>{props.misc}</p>
    </div>
  );
}

class ReviewForm extends React.Component {

  constructor(props) {
    super(props);
    var allDeptNames = new Map();
    var allCoursenums = new Map();
    var allProfs = new Map();
    for (let review of props.reviews) {
      let dept = review.dept;
      if (allDeptNames.has(dept)) {
        allDeptNames.get(dept).push(review)
      } else {
        allDeptNames.set(dept, [review])
      }
      let cn = review.coursenum;
      if (allCoursenums.has(cn)) {
        allCoursenums.get(cn).push(review)
      } else {
        allCoursenums.set(cn, [review])
      }
      let prof = review.prof;
      if (allProfs.has(prof)) {
        allProfs.get(prof).push(review)
      } else {
        allProfs.set(prof, [review])
      }
    }
    this.allDeptNames = allDeptNames
    this.allCoursenums = allCoursenums;
    this.allProfs = allProfs;
    this.deptList = Array.from(this.allDeptNames.keys()).sort();
    this.state = {
      dept: "",
      course: "",
      prof: "",
      search: ""
    }
  }

  deptChange(e) {
    this.setState({dept: e.target.value, course: "", prof: ""});
  }

  courseChange(e) {
    if (this.state.dept == "") {
      let dept = this.allCoursenums.get(e.target.value)[0].dept;
      this.setState({dept: dept, course: e.target.value});
      return;
    }
    this.setState({course: e.target.value});
  }

  profChange(e) {
    if (this.state.dept == "") {
      let dept = this.allProfs.get(e.target.value)[0].dept;
      this.setState({dept: dept, prof: e.target.value});
      return;
    }
    this.setState({prof: e.target.value});
  }

  render() {
    var reviews;
    var availCourses;
    var availProfs;
    if (this.state.dept == "") {
      reviews = this.props.reviews;
      availCourses = Array.from(this.allCoursenums.keys()).sort();
      availProfs = Array.from(this.allProfs.keys()).sort();
    } else {
      reviews = this.allDeptNames.get(this.state.dept);
      availCourses = reviews.filter(review => {
          return this.state.prof == "" || review.prof == this.state.prof
        }).map(review => {
          return review.coursenum.trim();
      });
      availProfs = reviews.filter(review => {
          return this.state.course == "" || review.coursenum == this.state.course
        }).map(review => {
          return review.prof.trim();
      });
      reviews = reviews.filter(review => {
        return (this.state.prof == "" || review.prof == this.state.prof)
          && (this.state.course == "" || review.coursenum == this.state.course)
          && (this.state.search == "" || review.classname.toLowerCase().includes(this.state.course));
      });
      availCourses = Array.from(new Set(availCourses)).sort();
      availProfs = Array.from(new Set(availProfs)).sort();
    }
    // reviews = sortReviews(reviews);
    return (
      <div className="Selectors">
        <select value={this.state.dept} onChange={this.deptChange.bind(this)}>
          <option key="" value=""> [All] </option>
          {this.deptList.map(deptname =>
            <option key={deptname}>{deptname}</option>
          )}
        </select>
        <select value={this.state.course} onChange={this.courseChange.bind(this)}>
          <option key="" value=""> [All] </option>
          {availCourses.map(cn =>
            <option key={cn}>{cn}</option>
          )}
        </select>
        <select value={this.state.prof} onChange={this.profChange.bind(this)}>
          <option key="" value=""> [All] </option>
          {availProfs.map(prof =>
            <option key={prof}>{prof}</option>
          )}
        </select>
        <input type="text" />
        {reviews.map(review => <Review {...review}/>)}
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props); 
    this.state = {
      isLoading: true,
      reviews: []
    };
  }

  readData2() {
    fetch('./reviews.json').then((response) => {
      return response.json();
    }).then((reviews) => {
      this.setState({reviews: reviews, isLoading: false});
    })
  }

  readData() {
    var API_KEY = 'AIzaSyC73u6fBIk6aZdnZCKeXRgCY9vYTVXrbDc';
    var SPREADSHEET_ID = '1AJO52gUTAElYGcfGMK07YkEfWdYNEITkjzS8hhOFTww'
    window.gapi.client.init({
      apiKey: API_KEY
    }).then(function () {
        // 3. Initialize and make the API request.
        var path = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`
        return window.gapi.client.request({
            "path": path,
            "method": "GET",
            "params": {
                "key": API_KEY
            }
        })
    }).then((response) => {
        var sheets = response.result.sheets;
        var titles = Array.from(sheets, sheet => {
          return sheet.properties.title;
        });
        var data = Array.from(sheets, sheet => {
          var title = sheet.properties.title;
          var path = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${title}`
          return window.gapi.client.request({
            "path": path,
            "method": "GET",
            "params": {
                "key": API_KEY
            }
          });
        });
        Promise.all(data).then((data) => {
          var reviews = [];
          for (let i=0; i<data.length; i++) {
            let sheet = data[i].result.values.slice(2);
            for (var row of sheet) {
              var rev = {
                dept: titles[i].trim(),
                coursenum: row[0].trim(),
                coursename: row[1].trim(),
                prof: row[2].trim(),
                date: row[3].trim(),
                difficulty: row[4].trim(),
                workload: row[5].trim(),
                lecture: row[6].trim(),
                misc: row[7].trim(),
                reviewer: row[8].trim()
              };
              reviews.push(rev);
            }
          }
          this.setState({reviews: reviews, isLoading: false});
        }, (error) => {
          console.log(error)
        })
    }, function(error) {
        console.log(error);
    });
  }

  componentDidMount() {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = () => {
      window.gapi.load('client', ()=>{this.readData2()})
    };

    document.body.appendChild(script);
  }

  render() {
    if (this.state.isLoading) {
      return (
      <center id='loading'>
        <h1>Loading ...</h1>
      </center>);
    }
    return (
      <div className="App">
        <ReviewForm reviews={this.state.reviews}></ReviewForm>
      </div>
    );
  }
}

export default App;
