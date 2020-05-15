import React from 'react';
import {FaAdjust} from 'react-icons/fa'
import './App.css';

function Review(props){
  var reviewer = props.reviewer ? <p><b>Reviewer: </b>{props.reviewer}</p> : null;
  var misc = props.misc ? <p><b>Miscellaneous: </b>{props.misc}</p> : null;
  return (
    <div className="review">
      <h2>{props.coursenum} {props.coursename} <br />
      {props.prof}, {props.date}</h2>
      {reviewer}
      <p><b>Difficulty: </b>{props.difficulty}</p>
      <p><b>Workload: </b>{props.workload}</p>
      <p><b>Lectures: </b>{props.lecture}</p>
      {misc}
    </div>
  );
}

class ReviewReader extends React.Component {

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
      console.log(e.target.value);
      let dept = this.allProfs.get(e.target.value)[0].dept;
      this.setState({dept: dept, prof: e.target.value});
      return;
    }
    this.setState({prof: e.target.value});
  }

  searchChange(e) {
    console.log('a')
    this.setState({search: e.target.value});
  }

  render() {
    var reviews = this.props.reviews;
    var availCourses;
    var availProfs;
    if (this.state.dept == "") {
      availCourses = Array.from(this.allCoursenums.keys()).sort();
      availProfs = Array.from(this.allProfs.keys()).sort();
    } else {
      reviews = this.allDeptNames.get(this.state.dept);
      availCourses = reviews.filter(review => {
          return this.state.prof == "" || review.prof == this.state.prof
        }).map(review => {
          return review.coursenum;
      });
      console.log(availCourses);
      availProfs = reviews.filter(review => {
          return this.state.course == "" || review.coursenum == this.state.course
        }).map(review => {
          return review.prof;
      });
      availCourses = Array.from(new Set(availCourses)).sort();
      availProfs = Array.from(new Set(availProfs)).sort();
    }
    reviews = reviews.filter(review => {
      return (this.state.prof == "" || review.prof == this.state.prof)
        && (this.state.course == "" || review.coursenum == this.state.course)
        && (this.state.search == "" || review.coursename.toLowerCase().includes(this.state.search));
    });
    // reviews = sortReviews(reviews);
    return (
      <div className="review-reader">
        <select className='selector' value={this.state.dept} onChange={this.deptChange.bind(this)}>
          <option key="" value=""> [All departments] </option>
          {this.deptList.map(deptname =>
            <option key={deptname}>{deptname}</option>
          )}
        </select>
        <select className='selector' value={this.state.course} onChange={this.courseChange.bind(this)}>
          <option key="" value=""> [All courses] </option>
          {availCourses.map(cn =>
            <option key={cn}>{cn}</option>
          )}
        </select>
        <select className='selector' value={this.state.prof} onChange={this.profChange.bind(this)}>
          <option key="" value=""> [All professors] </option>
          {availProfs.map(prof =>
            <option key={prof}>{prof}</option>
          )}
        </select>
        <input className='selector' type="text" placeholder="Course name search" onChange={this.searchChange.bind(this)}/>
        {reviews.map(review => <Review key={review.reviewID} {...review}/>)}
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props); 
    this.state = {
      isLoading: true,
      readMode: true,
      reviews: [],
      darkmode: false
    };
  }

  readData2() {
    fetch('./reviews.json').then((response) => {
      return response.json();
    }).then((reviews) => {
      this.setState({reviews: reviews, isLoading: false});
    })
  }

  async readKey() {
    return await fetch('./api.config').then((response) => {
      return response.json();
    }).then(kv => {return kv.key});
  }

  async readData() {
    var API_KEY = await this.readKey();
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
          let revCount = 0;
          for (let i=0; i<data.length; i++) {
            let sheet = data[i].result.values.slice(2);
            for (var row of sheet) {
              if (row.length < 9) {
                let l = 9 - row.length
                row.push(...Array.from({length: l}, () => ""))
              }
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
                reviewer: row[8].trim(),
                reviewID: `rev${revCount}`
              };
              reviews.push(rev);
              revCount += 1;
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

  toggleDarkMode() {
    this.setState(state => ({darkmode: !state.darkmode}));
  }

  render() {
    if (this.state.isLoading) {
      return (
      <center id='loading'>
        <h1>Loading ...</h1>
      </center>);
    }
    if (this.state.readMode) {
      return (
        <div className={this.state.darkmode ? 'App dark-mode': 'App'}>
          <FaAdjust size={32} id='darkmodeButton' className={this.state.darkmode ? 'dark-mode': null} onClick={() => this.toggleDarkMode()}/>
          <div className='column'>
            <button id='rwButton' className={this.state.darkmode ? 'dark-mode': 'button-lightmode'} onClick={() => this.setState({readMode: false})}>Submit a review!</button>
            <ReviewReader reviews={this.state.reviews}></ReviewReader>
          </div>
        </div>
      );
    } else {
      return (
        <div className="App">
          <button className='rwToggle' onClick={() => this.setState({readMode: true})}>Return to search</button>
          <ReviewReader reviews={this.state.reviews}></ReviewReader>
        </div>
      );
    }
  }
}

export default App;
