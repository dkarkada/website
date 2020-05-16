import React from 'react';
import {FaAdjust} from 'react-icons/fa'
import InfiniteScroll from 'react-infinite-scroller';
import TextareaAutosize from 'react-textarea-autosize'
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

function Semester2Num(date) {
  var arr = date.toLowerCase().split(/\s+/);
  if (arr.length >=2) {
    var sem = arr[0];
    var year = parseInt(arr[1]);
    if (isNaN(year)) {return 0;}
    if (sem == "spring") {
      return year + 0.1;
    }
    if (sem == "summer") {
      return year + 0.2;
    }
    if (sem == "fall") {
      return year + 0.3;
    }
    return year + 0.4;
  }
  return 0;
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
      search: "",
      availProfs: Array.from(this.allProfs.keys()).sort(),
      availCourses: Array.from(this.allCoursenums.keys()).sort(),
      availReviews: this.props.reviews,
      numRevShown: 20
    }
  }

  deptChange(e) {
    this.setState({dept: e.target.value, course: "", prof: ""});
    this.setState((state) => this.updateReviews(state));
  }

  courseChange(e) {
    if (this.state.dept == "") {
      let dept = this.allCoursenums.get(e.target.value)[0].dept;
      this.setState({dept: dept, course: e.target.value});
    } else {
      this.setState({course: e.target.value});
    }
    this.setState((state) => this.updateReviews(state));
  }

  profChange(e) {
    if (this.state.dept == "") {
      let dept = this.allProfs.get(e.target.value)[0].dept;
      this.setState({dept: dept, prof: e.target.value});
    } else {
      this.setState({prof: e.target.value});
    }
    this.setState((state) => this.updateReviews(state));
  }

  searchChange(e) {
    this.setState({search: e.target.value});
    this.setState((state) => this.updateReviews(state));
  }

  updateReviews(state) {
    console.log('a')
    var reviews = this.props.reviews;
    var availCourses;
    var availProfs;
    if (state.dept == "") {
      availCourses = Array.from(this.allCoursenums.keys()).sort();
      availProfs = Array.from(this.allProfs.keys()).sort();
    } else {
      reviews = this.allDeptNames.get(state.dept);
      availCourses = reviews.filter(review => {
          return state.prof == "" || review.prof == state.prof
        }).map(review => {
          return review.coursenum;
      });
      availProfs = reviews.filter(review => {
          return state.course == "" || review.coursenum == state.course
        }).map(review => {
          return review.prof;
      });
      availCourses = Array.from(new Set(availCourses)).sort();
      availProfs = Array.from(new Set(availProfs)).sort();
    }
    reviews = reviews.filter(review => {
      return (state.prof == "" || review.prof == state.prof)
        && (state.course == "" || review.coursenum == state.course)
        && (state.search == "" || review.coursename.toLowerCase().includes(state.search));
    });
    return ({availCourses: availCourses, availProfs: availProfs,
      availReviews: reviews, numRevShown: 20})
  }

  loadMoreReviews() {
    console.log('loading more');
    if (this.state.numRevShown + 20 < this.state.availReviews.length) {
      this.setState(state => ({
        numRevShown: state.numRevShown + 20
      }));
    }
    else {
      this.setState(state => ({
        numRevShown: state.availReviews.length
      }));
    }
  }

  render() {
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
          {this.state.availCourses.map(cn =>
            <option key={cn}>{cn}</option>
          )}
        </select>
        <select className='selector' value={this.state.prof} onChange={this.profChange.bind(this)}>
          <option key="" value=""> [All professors] </option>
          {this.state.availProfs.map(prof =>
            <option key={prof}>{prof}</option>
          )}
        </select>
        <input className='selector' type="text" placeholder="Course name search" onChange={this.searchChange.bind(this)}/>
        <InfiniteScroll
            pageStart={0}
            loadMore={this.loadMoreReviews.bind(this)}
            hasMore={this.state.availReviews.length != this.state.numRevShown}
            loader={<div className="loader" key={0}>Loading ...</div>}
        >
            {this.state.availReviews.slice(0, this.state.numRevShown).map(review => <Review key={review.reviewID} {...review}/>)}
        </InfiniteScroll>
      </div>
    );
  }
}

class ReviewWriter extends React.Component {
  constructor(props) {
    super(props);
    this.deptList = Array.from(new Set(props.reviews.map(rev => rev.dept)));
    var deptMap = new Map();
    for (let review of props.reviews) {
      let dept = review.dept;
      if (deptMap.has(dept)) {
        deptMap.get(dept).coursenums.add(review.coursenum);
        deptMap.get(dept).profs.add(review.prof);
        deptMap.get(dept).coursenames.add(review.coursename);
      } else {
        deptMap.set(dept, {coursenums: new Set([review.coursenum]),
                            profs: new Set([review.prof]),
                            coursenames: new Set([review.coursename])});
      }
    }
    this.deptMap = deptMap;
    this.state = {
      availCourses: Array.from(new Set(props.reviews.map(rev => rev.coursenum))),
      availProfs: Array.from(new Set(props.reviews.map(rev => rev.prof))),
      availCourseNames: Array.from(new Set(props.reviews.map(rev => rev.coursename)))
    }

    var today = new Date();
    this.dates = []
    var month = today.getMonth() + 1;
    var year = today.getFullYear();
    for (var i=0; i<12; i++) {
      if (month > 8 || month < 2) {
        this.dates.push(`Fall ${year}`);
        month = 8;
      }
      else if (month > 6) {
        this.dates.push(`Summer ${year}`);
        month = 6;
      }
      else {
        this.dates.push(`Spring ${year}`);
        month = 10;
        year -= 1;
      }
    }
  }
  
  deptChange(e) {
    var dept = e.target.value;
    this.setState({availCourses: Array.from(this.deptMap.get(dept).coursenums),
                  availProfs: Array.from(this.deptMap.get(dept).profs),
                  availCourseNames: Array.from(this.deptMap.get(dept).coursenames)});
  }

  render() {
    return (
      <div className="review-writer">
        <label for="reviewerInp">Reviewer (optional): </label>
        <input className="selector" id="reviewerInp" />
        <label for="deptSelect">Department: </label>
        <select id="deptSelect" className='selector' required onChange={this.deptChange.bind(this)}>
          <option disabled selected></option>
          {this.deptList.map(deptname =>
            <option key={deptname}>{deptname}</option>
            )}
        </select>
        <label for="courseSelect">Course number: </label>
        <input className="selector" id="courseSelect" required list="coursenum" />
          <datalist id="coursenum" style={{height:1}}>
            {this.state.availCourses.map(cn =>
              <option key={cn} value={cn}/>
              )}
          </datalist>
        <label for="coursenameInp">Course name: </label>
        <input className="selector" id="coursenameInp" required list="coursename" />  
          <datalist id="coursename">
            {this.state.availCourseNames.map(cn =>
              <option key={cn} value={cn}/>
            )}
          </datalist>
        <label for="profSelect">Professor: </label>
        <input className="selector" id="profSelect" required list="prof" />
          <datalist id="prof">
            {this.state.availProfs.map(prof =>
              <option key={prof} value={prof}/>
            )}
          </datalist>
        <label for="dateSelect">Date taken: </label>
        <select id="dateSelect" className='selector' required>
          {this.dates.map(date =>
            <option key={date}>{date}</option>
          )}
        </select>
        <label for="difficultyBox">Difficulty: </label>
        <TextareaAutosize
          id="difficultyBox"
          style={{width:"90%", resize:"none"}}
          minRows={3}
          maxRows={15}
          placeholder="How hard are the concepts/workload? Is it hard to get a good grade? Etc."
          className="selector"
        />
        <label for="workloadBox">Workload: </label>
        <TextareaAutosize
          id="workloadBox"
          style={{width:"90%", resize:"none"}}
          minRows={3}
          maxRows={15}
          placeholder="What types of assignments are there? How many hours a week do they take? Etc."
          className="selector"
        />
        <label for="lectureBox">Lectures: </label>
        <TextareaAutosize
          id="lectureBox"
          style={{width:"90%", resize:"none"}}
          minRows={3}
          maxRows={15}
          placeholder="How were lectures? Worth/required to go to class? Etc."
          className="selector"
        />
        <label for="miscBox">Miscellaneous: </label>
        <TextareaAutosize
          id="miscBox"
          style={{width:"90%", resize:"none"}}
          minRows={3}
          maxRows={15}
          className="selector"
        />
        <button id='submitButton' className={this.state.darkMode ? 'dark-mode': null} onClick={() => this.toggleReadMode()}>Submit!</button>
        <div style={{"min-height": "20vh"}}/>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    var darkmode;
    if(localStorage.getItem("theme")){
      if(localStorage.getItem("theme") == "dark"){
          darkmode = true;
          document.documentElement.setAttribute('data-theme', 'dark');
      }
    } else {
      darkmode = false;
      document.documentElement.setAttribute('data-theme', 'light');
    }
    this.state = {
      isLoading: true,
      readMode: false,
      reviews: [],
      darkMode: false
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
              rev.datenum = Semester2Num(rev.date);
              reviews.push(rev);
              revCount += 1;
            }
          }
          reviews.sort((rev1, rev2) => rev2.datenum - rev1.datenum);
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
    this.setState(state => {
      if (state.darkMode) {
        localStorage.setItem('theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
      return ({darkMode: !state.darkMode});
    });
  }

  toggleReadMode() {
    this.setState(state => ({readMode: !state.readMode}));
  }
  
  render() {
    if (this.state.isLoading) {
      return (
        <center id='loading'>
        <h1>Loading ...</h1>
      </center>);
    }
    var content;
    var btn;
    if (this.state.readMode) {
      content = <ReviewReader reviews={this.state.reviews}></ReviewReader>;
      btn = "Submit a review!";
    } else {
      content = <ReviewWriter reviews={this.state.reviews}></ReviewWriter>;
      btn = "Return to search"
    }
    return (
      <div className={this.state.darkMode ? 'App dark-mode': 'App'}>
        <FaAdjust size={32} id='darkmodeButton' className={this.state.darkMode ? 'dark-mode': null} onClick={() => this.toggleDarkMode()}/>
        <div className='column'>
          <button id='rwButton' className={this.state.darkMode ? 'dark-mode': null} onClick={() => this.toggleReadMode()}>{btn}</button>
          {content}
        </div>
      </div>
    );
  }
}

export default App;
