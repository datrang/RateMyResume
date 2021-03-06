// Initialize Firebase
var config = {
  apiKey: "AIzaSyCxdoH5XmTKOXxA37mK_I_gDRi5fkvrXkk",
  authDomain: "resume-rater.firebaseapp.com",
  databaseURL: "https://resume-rater.firebaseio.com",
  projectId: "resume-rater",
  storageBucket: "resume-rater.appspot.com",
  messagingSenderId: "220789866717"
};

firebase.initializeApp(config);


const firestore = firebase.firestore();
const settings = { /* your settings... */
  timestampsInSnapshots: true
};
let current_page = window.location.pathname.split('/').pop();

firestore.settings(settings);
firebase.auth().onAuthStateChanged(function(user) {
    let homeTab = document.getElementById("homeTab");
    let profileTab = document.getElementById("profileTab");
    let loginTab = document.getElementById("loginTab");
    let hubTab = document.getElementById("hubTab");
    let rateTab = document.getElementById("rateTab");
    let email = document.getElementById("email");
    let name = document.getElementById("name");
    let profileRating = document.getElementById("profileRating");
    loading.style.display = "block";
    doneLoading.style.display = "none";
    if (user) {
      if(email != null && name != null){
        document.getElementById("email").innerHTML = user.email;
        document.getElementById("name").innerHTML = user.displayName;
      }
      // console.log(current_page);
      switch(current_page){
          case "index":
              let user = firebase.auth().currentUser;
              if(user){
                  location.href='hub';
              }
              break;
          case "hub":
              show_user_latest_resume();
              show_user_latest_resume_reviews();
              show_user_past_resume();
              // getResumeHubRating("hubResumeRating");
              break;
          case "rateresume":
              show_other_resume();
              break;
          case "profile":
              //setUserRating(getCurrentUserId(),5,1);
              getUserRating("profileRating");
              break;
          case "resume_reviews":
              // console.log("Resume Review");
              let vars = {};
              window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                  vars[key] = value;
              });
              // console.log(vars['id']);
              let current_resume_id = vars['id'];
              show_current_resume(current_resume_id);
              show_current_resume_replies(current_resume_id);
              check_reply();
              break;
      }

      homeTab.style.display = "none";
      profileTab.style.display = "block";
      hubTab.style.display = "block";
      rateTab.style.display = "block";
      loginTab.style.display = "none";
      // User is signed in.
    } else {
      // No user is signed in."
      homeTab.style.display = "block";
      profileTab.style.display = "none";
      hubTab.style.display = "none";
      rateTab.style.display = "none";
      loginTab.style.display = "block";
    }
    loading.style.display = "none";
    doneLoading.style.display = "block";
});

let listing_mouseover = function(listing){
    listing.style.background = "#F5F6F7"
};

let listing_mouseout = function(listing){
    listing.style.background = "#FFFFFF"
};

// let set_current_user_rating = function(current_resume_id){
//         firestore.collection('resumes').doc(current_resume_id).collection('rating').where("uid", "==",getCurrentUserId()).limit(1).get().then((snapshot) => {
//         if(!snapshot.empty){
//             snapshot.docs.forEach(doc => {
//                 document.getElementById('current_user_rating').innerHTML = doc.data().rating;
//             })
//         }
//     })
// }

let getCurrentUserId = function(){
  return firebase.auth().currentUser.uid;
};

let setUserRating = function (userID, newValue){
    if(current_page == "hub"){
        firestore.collection("resumes").where("user", "==", getCurrentUserId()).orderBy("upload_time","desc").limit(1).get().then((snapshot) =>
                snapshot.docs.forEach(current_resume => {
                    let current_resume_id = current_resume.id;
                    firestore.collection("resumes").doc(current_resume_id).collection("replies").where("uid", "==", userID).limit(1).get().then((snapshot) =>
                        snapshot.docs.forEach(doc => {
                            if(doc.data().userRating != newValue){
                                // set the user rating value
                                firestore.collection("users").where("uid", "==", userID).limit(1).get().then((snapshot) => {
                                    if(!snapshot.empty){
                                        snapshot.docs.forEach(user => {
                                            // console.log(doc.data().userRating);
                                            // console.log("user:", user.data().totalRating);
                                            // console.log("newValue:", newValue);
                                            let newTotal = user.data().totalRating - doc.data().userRating + newValue;
                                            // console.log("newTotal= ",  newTotal);
                                            let newCount = user.data().numRate;
                                            // console.log(doc.data().userRating);
                                            if(doc.data().userRating == 0){
                                                // console.log("Reached");
                                                newCount = user.data().numRate + 1;
                                            }
                                            // console.log("newTotal=", newTotal);
                                            // console.log("newCount=", newCount);
                                            firestore.collection("users").doc(user.id).update({
                                                totalRating: newTotal,
                                                numRate: newCount
                                            }).then(function(){
                                                // console.log("Database upated");
                                            }).catch(function(error){
                                                // console.log("Error updating user: ", error);
                                            })
                                        });
                                        // set and keep track of owner review of reply
                                        firestore.collection("resumes").doc(current_resume_id).collection("replies").where("uid", "==", userID).get().then((snapshot) =>
                                            snapshot.docs.forEach(resume => {
                                                // console.log(resume.id);
                                                firestore.collection("resumes").doc(current_resume_id).collection("replies").doc(resume.id).update({
                                                    userRating: newValue
                                                }).then(function() {
                                                    // console.log("Document successfully updated!");
                                                }).catch(function(error) {
                                                    // console.error("Error updating document: ", error);
                                                });
                                            })
                                        );
                                    }else {
                                        // console.log("IT DOESN'T EXIST");
                                    }
                                });
                            }
                        })
                    );
                })
        );
    }else{
        let vars = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        let current_resume_id = vars['id'];
        firestore.collection("resumes").doc(current_resume_id).collection("replies").where("uid", "==", userID).limit(1).get().then((snapshot) =>
                snapshot.docs.forEach(doc => {
                    if(doc.data().userRating != newValue){
                        // set the user rating value
                        firestore.collection("users").where("uid", "==", userID).limit(1).get().then((snapshot) => {
                            if(!snapshot.empty){
                                snapshot.docs.forEach(user => {
                                    // console.log("doc:", doc.data().userRating);
                                    // console.log("user:", user.data().totalRating);
                                    // console.log("newValue:", newValue);
                                    let newTotal = user.data().totalRating - doc.data().userRating + newValue;
                                    // console.log("newTotal= ",  newTotal);
                                    let newCount = user.data().numRate;
                                    // console.log(doc.data().userRating);
                                    if(doc.data().userRating == 0){
                                        // console.log("Reached");
                                        newCount = user.data().numRate + 1;
                                    }
                                    // console.log("newCount=", newCount);
                                    firestore.collection("users").doc(user.id).update({
                                        totalRating: newTotal,
                                        numRate: newCount
                                    }).then(function(){
                                        // console.log("Database upated");
                                    }).catch(function(error){
                                        // console.log("Error updating user: ", error);
                                    })
                                });
                                // set and keep track of owner review of reply
                                firestore.collection("resumes").doc(current_resume_id).collection("replies").where("uid", "==", userID).get().then((snapshot) =>
                                    snapshot.docs.forEach(resume => {
                                        // console.log(resume.id);
                                        firestore.collection("resumes").doc(current_resume_id).collection("replies").doc(resume.id).update({
                                            userRating: newValue
                                        }).then(function() {
                                            // console.log("Document successfully updated!");
                                        }).catch(function(error) {
                                            // console.error("Error updating document: ", error);
                                        });
                                    })
                                );
                            }else {
                                // console.log("IT DOESN'T EXIST");
                            }
                        });
                    }
                })
            );
    }
};

let getUserRating = function (ratingField){
  let user = firebase.auth().currentUser;
  let users_ref = firestore.collection("users");
  users_ref.where("uid", "==", getCurrentUserId()).limit(1).get().then((snapshot) =>
      snapshot.docs.forEach(doc => {
        let total = doc.data().totalRating;
        let num = doc.data().numRate;
        if(num == 0){
          document.getElementById(ratingField).innerHTML = "No Ratings So Far";
        }
        else{
          document.getElementById(ratingField).innerHTML ="Rating: "+ (Math.round(total/num *10) / 10)+"/5";
        }
      })
  );
};

let getResumeRating = function(userID, ratingField){
  let resume_ref = firestore.collection("resumes").doc((userID));
  resume_ref.get().then(function(doc){
    let total = doc.data().totalRating;
    let count = doc.data().numRate;
    document.getElementById(ratingField).innerHTML = "Rating: " + (Math.round(total/count *10) / 10) + "/5";
  })
};

let setResumeRating = function(userID,newValue,count){
  let resume_ref = firestore.collection("resumes").doc(userID);
  let newTotal = 0;
  let newCount = 0;
  resume_ref.get().then(function(doc){
    newTotal = doc.data().totalRating + newValue;
    newCount = doc.data().numRate + count;
    resume_ref.update({
        totalRating : newTotal,
        numRate : newCount
    }).then(function(){
        // console.log("Database upated");
    }).catch(function(error){
        // console.log("Error updating user: ", error);
    })
  }).catch(function(error) {
    // console.log("Error getting document:", error);
});
  // console.log("called set" + userID + " " + newTotal + " " + newCount);
};

let renderResumeList = function(doc){
    let li = document.createElement('li');
    let name = document.createElement('span');
    let resume = document.createElement('iframe');
    let date = document.createElement('span');

    li.setAttribute('data-id', doc.id);
    name.textContent = doc.data().name;
    resume.src = doc.data().url;
    date.textContent = doc.data().upload_time.toDate();

    li.appendChild(name);
    li.appendChild(resume);
    li.appendChild(date);

    resume_list.appendChild(li);
};

// let showResume = function(){
//     console.log("Show Resume");
//     firestore.collection("resumes").where("user", "==", getCurrentUserId()).get().then((snapshot) =>
//         snapshot.docs.forEach(doc => {
//             // console.log(doc.data().name);
//             // console.log(doc.data().upload_time.toDate());
//             // console.log(doc.data().url);
//             renderResumeList(doc);
//         })
//     );
// };

let render_user_resume_list = function(doc){
    let main_container = document.createElement('div');
    main_container.classList.add('resume_listing');
    main_container.classList.add('container');
    main_container.onclick = function(){
        location.href='resume_reviews?id=' + doc.id;
    };
    main_container.onmouseover = function(){
        main_container.style.background = "#F5F6F7";
    };
    main_container.onmouseout = function(){
        main_container.style.background = "#FFFFFF";
    };

    //left half
    let left_container = document.createElement('div');
    left_container.classList.add("half");
    left_container.classList.add("container");
    let left_third_1_container = document.createElement('div');
    left_third_1_container.classList.add("third");
    left_container.append(left_third_1_container);
    let left_third_2_container = document.createElement('div');
    left_third_2_container.classList.add("third");
    left_container.append(left_third_2_container);
    let left_third_2_span = document.createElement('span');
    let left_third_2_file_preview = document.createElement('i');
    left_third_2_file_preview.classList.add("fa");
    left_third_2_file_preview.classList.add("fa-file-text");
    left_third_2_file_preview.classList.add("fa-5x");
    left_third_2_file_preview.setAttribute("style", "margin: 25px auto");
    left_third_2_span.append(left_third_2_file_preview);
    left_third_2_container.append(left_third_2_span);
    main_container.append(left_container);

    //right half
    let right_container = document.createElement('div');
    right_container.classList.add("half");
    right_container.classList.add("container");
    let right_resume_title = document.createElement('h6');
    right_resume_title.textContent = doc.data().name.slice(0,-4);
    right_container.append(right_resume_title);
    let right_resume_date = document.createElement('div');
    right_resume_date.classList.add("listing_date");
    right_resume_date.classList.add("listing_text");
    let timestamp = doc.data().upload_time.toDate();
    right_resume_date.textContent = "Upload Date: " +(timestamp.getMonth()+1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear();
    right_container.append(right_resume_date);
    let right_resume_description = document.createElement('div');
    right_resume_description.classList.add("listing_description");
    right_resume_description.classList.add("listing_text");
    right_resume_description.textContent = doc.data().description;
    right_container.append(right_resume_description);
    let right_resume_rating = document.createElement('div');
    right_resume_rating.classList.add("listing_rating");
    right_resume_rating.classList.add("listing_text");
    let total = doc.data().totalRating;
    let numCount = doc.data().numRate;
    if(numCount == 0){right_resume_rating.textContent = "No Ratings So Far";}
    else {right_resume_rating.textContent = "Rating: " + (Math.round(total/numCount *10) / 10) + "/5";}
    right_container.append(right_resume_rating);
    main_container.append(right_container);

    user_past_resume_list.append(main_container);
};

let show_user_past_resume = function (){
    let user_resume_ref = firestore.collection("resumes").where("user", "==", getCurrentUserId());
    user_resume_ref.orderBy("upload_time","desc").limit(1).get().then((snapshot =>
            snapshot.docs.forEach(doc => {
                // console.log(doc.data().name);
                user_resume_ref.where("upload_time", "<", doc.data().upload_time).get().then((snapshot =>
                        snapshot.docs.forEach(doc => {
                            // console.log(doc.data().name);
                            render_user_resume_list(doc);
                        })
                ))
            })
    ))
};

let render_other_resume = function(doc){
    let main_container = document.createElement('div');
    main_container.classList.add('resume_listing');
    main_container.classList.add('container');
    main_container.onclick = function(){
        location.href='resume_reviews?id=' + doc.id;
    };
    main_container.onmouseover = function(){
        main_container.style.background = "#F5F6F7";
    };
    main_container.onmouseout = function(){
        main_container.style.background = "#FFFFFF";
    };

    //left half
    let left_container = document.createElement('div');
    left_container.classList.add("half");
    left_container.classList.add("container");
    let left_third_1_container = document.createElement('div');
    left_third_1_container.classList.add("third");
    left_container.append(left_third_1_container);
    let left_third_2_container = document.createElement('div');
    left_third_2_container.classList.add("third");
    left_container.append(left_third_2_container);
    let left_third_2_span = document.createElement('span');
    let left_third_2_file_preview = document.createElement('i');
    left_third_2_file_preview.classList.add("fa");
    left_third_2_file_preview.classList.add("fa-file-text");
    left_third_2_file_preview.classList.add("fa-5x");
    left_third_2_file_preview.setAttribute("style", "margin: 25px auto");
    left_third_2_span.append(left_third_2_file_preview);
    left_third_2_container.append(left_third_2_span);
    main_container.append(left_container);

    //right half
    let right_container = document.createElement('div');
    right_container.classList.add("half");
    right_container.classList.add("container");
    let right_resume_title = document.createElement('h6');
    right_resume_title.textContent = doc.data().name.slice(0,-4);
    right_container.append(right_resume_title);
    let right_resume_author = document.createElement('div');
    right_resume_author.classList.add('listing_author');
    right_resume_author.classList.add('listing_text');
    firestore.collection("users").where("uid", "==", doc.data().user).limit(1).get().then((snapshot) =>
            snapshot.docs.forEach(user => {
                right_resume_author.textContent = "Author: " + user.data().name;
            })
    );
    right_container.append(right_resume_author);
    let right_resume_date = document.createElement('div');
    right_resume_date.classList.add("listing_date");
    right_resume_date.classList.add("listing_text");
    let timestamp = doc.data().upload_time.toDate();
    right_resume_date.textContent = (timestamp.getMonth()+1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear();
    right_container.append(right_resume_date);
    let right_resume_description = document.createElement('div');
    right_resume_description.classList.add("listing_description");
    right_resume_description.classList.add("listing_text");
    right_resume_description.textContent = doc.data().description;
    right_container.append(right_resume_description);
    let right_resume_rating = document.createElement('div');
    right_resume_rating.classList.add("listing_rating");
    right_resume_rating.classList.add("listing_text");
    let total = doc.data().totalRating;
    let numCount = doc.data().numRate;
    if(numCount == 0){right_resume_rating.textContent = "No Ratings So Far";}
    else {right_resume_rating.textContent = "Rating: " + (Math.round(total/numCount *10) / 10) + "/5";}
    right_container.append(right_resume_rating);
    main_container.append(right_container);

    other_resume_list.append(main_container);
};

let show_other_resume = function(){
    // console.log("Current User = " + getCurrentUserId());
    firestore.collection("resumes").orderBy("upload_time","desc").get().then((snapshot) =>
        snapshot.docs.forEach(doc => {
            if(doc.data().user != getCurrentUserId()){
                // console.log("Doc name = " + doc.data().name);
                // console.log("Doc Owner = " + doc.data().user);
                render_other_resume(doc);
            }
        })
    );
};

let show_user_latest_resume = function (){
    firestore.collection("resumes").where("user", "==", getCurrentUserId()).orderBy("upload_time","desc").limit(1).get().then((snapshot =>
        {
            if(snapshot.empty){
                document.getElementById("user_latest_resume_name").innerHTML = "Please Upload a Resume";
            }else{
                snapshot.docs.forEach(doc => {
                    // console.log(doc.data().name);
                    document.getElementById("user_latest_resume_name").innerHTML = doc.data().name.slice(0,-4);
                    document.getElementById("user_latest_resume_file").src = doc.data().url;
                    let timestamp = doc.data().upload_time.toDate();
                    let date = (timestamp.getMonth()+1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear();
                    document.getElementById("user_latest_resume_date").innerHTML = "Upload Date: " + date;
                    document.getElementById("user_latest_resume_description").innerHTML = doc.data().description;
                    let total = doc.data().totalRating;
                    let numCount = doc.data().numRate;
                    if(numCount == 0){document.getElementById("user_latest_resume_rating").innerHTML = "No Ratings So Far";}
                    else {document.getElementById("user_latest_resume_rating").innerHTML = "Rating: " + (Math.round(total/numCount *10) / 10) + "/5";}
                })
            }
        }
    ))
};

let refresh_user_latest_rating = function(){
  firestore.collection("resumes").where("user", "==", getCurrentUserId()).orderBy("upload_time","desc").limit(1).get().then((snapshot =>
      {
        snapshot.docs.forEach(doc => {
            let total = doc.data().totalRating;
            let numCount = doc.data().numRate;
            if(numCount == 0){
                document.getElementById("current_resume_rating").innerHTML = "No Ratings So Far";
                // console.log("HERE")
            }
            else {
                document.getElementById("current_resume_rating").innerHTML = "Rating: " + (Math.round(total/numCount *10) / 10) + "/5";
                // console.log("THIS")
            }
          })
      }
  ))
};

let show_user_latest_resume_reviews = function(){
    firestore.collection("resumes").where("user", "==", getCurrentUserId()).orderBy("upload_time","desc").limit(1).get().then((snapshot =>
        {
            if(snapshot.empty){
                // console.log("No Resume");
            }else{
                snapshot.docs.forEach(doc => {
                    firestore.collection('resumes').doc(doc.id).collection('replies').get().then((snapshot) =>
                        snapshot.docs.forEach(reply => {
                            render_current_resume_replies(reply);
                            // console.log(reply.data().content);
                            // console.log(reply.data().uid);
                        })
                    )
                })
            }
        }
    ));
};

let show_current_resume = function (current_resume_id){
    firestore.collection('resumes').doc(current_resume_id).get().then(doc =>{
        document.getElementById("current_resume_name").innerHTML = doc.data().name.slice(0,-4);
        document.getElementById("current_resume_file").src = doc.data().url;
        document.getElementById("current_resume_file").src = doc.data().url;
        firestore.collection("users").where("uid", "==", doc.data().user).limit(1).get().then((snapshot) =>
            snapshot.docs.forEach(user => {
                document.getElementById("current_resume_author").innerHTML = "Author: " + user.data().name;
            })
        );
      document.getElementById("current_resume_description").innerHTML = "Description: " + doc.data().description;
        // document.getElementById("current_resume_author").innerHTML = "Author: " + doc.data().user_name;
        let timestamp = doc.data().upload_time.toDate();
        document.getElementById("current_resume_date");
        let date = (timestamp.getMonth()+1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear();
        document.getElementById("current_resume_date").innerHTML = "Upload Date: " + date;
        let total = doc.data().totalRating;
        let numCount = doc.data().numRate;
        if(numCount == 0){document.getElementById("current_resume_rating").innerHTML = "No Ratings So Far";}
        else {document.getElementById("current_resume_rating").innerHTML = "Rating: " + (Math.round(total/numCount *10) / 10) + "/5";}
    }).catch(function(error){
        // console.log("Error getting document:", error);
    });
};

let render_current_resume_replies = function(doc){
    // console.log("REACHED");
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    let current_resume_id = vars['id'];

    if(current_page == 'hub'){
        let main_container = document.createElement('div');
        main_container.classList.add("feedback_listing");
        main_container.classList.add("container");

        let left_container = document.createElement('div');
        left_container.classList.add('third');
        left_container.classList.add('container');

        let left_container_half1 = document.createElement('div');
        left_container_half1.classList.add('half');

        let left_container_half1_profile_pic = document.createElement('i');
        left_container_half1_profile_pic.classList.add('center');
        left_container_half1_profile_pic.classList.add('fa');
        left_container_half1_profile_pic.classList.add('fa-user');
        left_container_half1_profile_pic.classList.add('fa-3x');

        left_container_half1.append(left_container_half1_profile_pic);

        let left_container_half1_user_review = document.createElement('form');

        let left_container_half1_user_review_button1 = document.createElement('input');
        left_container_half1_user_review_button1.type = "radio";
        left_container_half1_user_review_button1.name = "rating";
        left_container_half1_user_review_button1.value = "1";
        if(doc.data().userRating == 1){
            left_container_half1_user_review_button1.checked = true;
        }
        left_container_half1_user_review_button1.onclick = function(){
            setUserRating(doc.data().uid, 1);
        };
        left_container_half1_user_review.append(left_container_half1_user_review_button1);
        let left_container_half1_user_review_button1_span = document.createElement('span');
        left_container_half1_user_review_button1_span.innerHTML = "1 ";
        left_container_half1_user_review.append(left_container_half1_user_review_button1_span);

        let left_container_half1_user_review_button2 = document.createElement('input');
        left_container_half1_user_review_button2.type = "radio";
        left_container_half1_user_review_button2.name = "rating";
        left_container_half1_user_review_button2.value = "2";
        if(doc.data().userRating == 2){
            left_container_half1_user_review_button2.checked = true;
        }
        left_container_half1_user_review_button2.onclick = function(){
            setUserRating(doc.data().uid, 2);
        };
        left_container_half1_user_review.append(left_container_half1_user_review_button2);
        let left_container_half1_user_review_button2_span = document.createElement('span');
        left_container_half1_user_review_button2_span.innerHTML = " 2 ";
        left_container_half1_user_review.append(left_container_half1_user_review_button2_span);

        let left_container_half1_user_review_button3 = document.createElement('input');
        left_container_half1_user_review_button3.type = "radio";
        left_container_half1_user_review_button3.name = "rating";
        left_container_half1_user_review_button3.value = "3";
        if(doc.data().userRating == 3){
            left_container_half1_user_review_button3.checked = true;
        }
        left_container_half1_user_review_button3.onclick = function(){
            setUserRating(doc.data().uid, 3);
        };
        left_container_half1_user_review.append(left_container_half1_user_review_button3);
        let left_container_half1_user_review_button3_span = document.createElement('span');
        left_container_half1_user_review_button3_span.innerHTML = " 3 ";
        left_container_half1_user_review.append(left_container_half1_user_review_button3_span);

        let left_container_half1_user_review_button4 = document.createElement('input');
        left_container_half1_user_review_button4.type = "radio";
        left_container_half1_user_review_button4.name = "rating";
        left_container_half1_user_review_button4.value = "4";
        if(doc.data().userRating == 4){
            left_container_half1_user_review_button4.checked = true;
        }
        left_container_half1_user_review_button4.onclick = function(){
            setUserRating(doc.data().uid, 4);
        };
        left_container_half1_user_review.append(left_container_half1_user_review_button4);
        let left_container_half1_user_review_button4_span = document.createElement('span');
        left_container_half1_user_review_button4_span.innerHTML = " 4 ";
        left_container_half1_user_review.append(left_container_half1_user_review_button4_span);

        let left_container_half1_user_review_button5 = document.createElement('input');
        left_container_half1_user_review_button5.type = "radio";
        left_container_half1_user_review_button5.name = "rating";
        left_container_half1_user_review_button5.value = "5";
        if(doc.data().userRating == 5){
            left_container_half1_user_review_button5.checked = true;
        }
        left_container_half1_user_review_button5.onclick = function(){
            setUserRating(doc.data().uid, 5);
        };
        left_container_half1_user_review.append(left_container_half1_user_review_button5);
        let left_container_half1_user_review_button5_span = document.createElement('span');
        left_container_half1_user_review_button5_span.innerHTML = " 5 ";
        left_container_half1_user_review.append(left_container_half1_user_review_button5_span);

        left_container_half1.append(left_container_half1_user_review);

        left_container.append(left_container_half1);

        let left_container_half2 = document.createElement('div');
        left_container_half2.classList.add('half');
        let left_container_half2_author = document.createElement('div');
        left_container_half2_author.classList.add('listing_author');
        left_container_half2_author.classList.add('listing_text');
        let left_container_half2_title = document.createElement('div');
        left_container_half2_title.classList.add('listing_text');
        firestore.collection("users").where("uid", "==", doc.data().uid).limit(1).get().then((snapshot) =>
            snapshot.docs.forEach(user => {
                left_container_half2_author.innerHTML = user.data().name;
                left_container_half2_title.innerHTML = user.data().occupation;
            })
        );

        left_container_half2.append(left_container_half2_author);
        left_container_half2.append(left_container_half2_title);
        left_container.append(left_container_half2);
        main_container.append(left_container);

        let right_container = document.createElement('div');
        right_container.classList.add('twothirds');
        let right_container_content = document.createElement('div');
        right_container_content.classList.add('listing_description');
        right_container_content.classList.add('listing_text');
        right_container_content.innerHTML = doc.data().content;
        let right_container_score = document.createElement('div');
        right_container_score.classList.add('listing_description');
        right_container_score.classList.add('listing_text');
        right_container_score.innerHTML = "Score:" + doc.data().totalRating;

        right_container.append(right_container_content);
        right_container.append(right_container_score);
        main_container.append(right_container);

        resume_review_list.prepend(main_container);
    }else {
        firestore.collection('resumes').doc(current_resume_id).get().then(info => {
            let user = firebase.auth().currentUser;
            if (info.data().user == user.uid) {
                let main_container = document.createElement('div');
                main_container.classList.add("feedback_listing");
                main_container.classList.add("container");

                let left_container = document.createElement('div');
                left_container.classList.add('third');
                left_container.classList.add('container');

                let left_container_half1 = document.createElement('div');
                left_container_half1.classList.add('half');

                let left_container_half1_profile_pic = document.createElement('i');
                left_container_half1_profile_pic.classList.add('center');
                left_container_half1_profile_pic.classList.add('fa');
                left_container_half1_profile_pic.classList.add('fa-user');
                left_container_half1_profile_pic.classList.add('fa-3x');

                left_container_half1.append(left_container_half1_profile_pic);

                let left_container_half1_user_review = document.createElement('form');

                let left_container_half1_user_review_button1 = document.createElement('input');
                left_container_half1_user_review_button1.type = "radio";
                left_container_half1_user_review_button1.name = "rating";
                left_container_half1_user_review_button1.value = "1";
                if(doc.data().userRating == 1){
                    left_container_half1_user_review_button1.checked = true;
                }
                left_container_half1_user_review_button1.onclick = function(){
                    setUserRating(doc.data().uid, 1);
                };
                left_container_half1_user_review.append(left_container_half1_user_review_button1);
                let left_container_half1_user_review_button1_span = document.createElement('span');
                left_container_half1_user_review_button1_span.innerHTML = "1 ";
                left_container_half1_user_review.append(left_container_half1_user_review_button1_span);

                let left_container_half1_user_review_button2 = document.createElement('input');
                left_container_half1_user_review_button2.type = "radio";
                left_container_half1_user_review_button2.name = "rating";
                left_container_half1_user_review_button2.value = "2";
                if(doc.data().userRating == 2){
                    left_container_half1_user_review_button2.checked = true;
                }
                left_container_half1_user_review_button2.onclick = function(){
                    setUserRating(doc.data().uid, 2);
                };
                left_container_half1_user_review.append(left_container_half1_user_review_button2);
                let left_container_half1_user_review_button2_span = document.createElement('span');
                left_container_half1_user_review_button2_span.innerHTML = " 2 ";
                left_container_half1_user_review.append(left_container_half1_user_review_button2_span);

                let left_container_half1_user_review_button3 = document.createElement('input');
                left_container_half1_user_review_button3.type = "radio";
                left_container_half1_user_review_button3.name = "rating";
                left_container_half1_user_review_button3.value = "3";
                if(doc.data().userRating == 3){
                    left_container_half1_user_review_button3.checked = true;
                }
                left_container_half1_user_review_button3.onclick = function(){
                    setUserRating(doc.data().uid, 3);
                };
                left_container_half1_user_review.append(left_container_half1_user_review_button3);
                let left_container_half1_user_review_button3_span = document.createElement('span');
                left_container_half1_user_review_button3_span.innerHTML = " 3 ";
                left_container_half1_user_review.append(left_container_half1_user_review_button3_span);

                let left_container_half1_user_review_button4 = document.createElement('input');
                left_container_half1_user_review_button4.type = "radio";
                left_container_half1_user_review_button4.name = "rating";
                left_container_half1_user_review_button4.value = "4";
                if(doc.data().userRating == 4){
                    left_container_half1_user_review_button4.checked = true;
                }
                left_container_half1_user_review_button4.onclick = function(){
                    setUserRating(doc.data().uid, 4);
                };
                left_container_half1_user_review.append(left_container_half1_user_review_button4);
                let left_container_half1_user_review_button4_span = document.createElement('span');
                left_container_half1_user_review_button4_span.innerHTML = " 4 ";
                left_container_half1_user_review.append(left_container_half1_user_review_button4_span);

                let left_container_half1_user_review_button5 = document.createElement('input');
                left_container_half1_user_review_button5.type = "radio";
                left_container_half1_user_review_button5.name = "rating";
                left_container_half1_user_review_button5.value = "5";
                if(doc.data().userRating == 5){
                    left_container_half1_user_review_button5.checked = true;
                }
                left_container_half1_user_review_button5.onclick = function(){
                    setUserRating(doc.data().uid, 5);
                };
                left_container_half1_user_review.append(left_container_half1_user_review_button5);
                let left_container_half1_user_review_button5_span = document.createElement('span');
                left_container_half1_user_review_button5_span.innerHTML = " 5 ";
                left_container_half1_user_review.append(left_container_half1_user_review_button5_span);

                left_container_half1.append(left_container_half1_user_review);

                left_container.append(left_container_half1);

                let left_container_half2 = document.createElement('div');
                left_container_half2.classList.add('half');
                let left_container_half2_author = document.createElement('div');
                left_container_half2_author.classList.add('listing_author');
                left_container_half2_author.classList.add('listing_text');
                let left_container_half2_title = document.createElement('div');
                left_container_half2_title.classList.add('listing_text');
                firestore.collection("users").where("uid", "==", doc.data().uid).limit(1).get().then((snapshot) =>
                    snapshot.docs.forEach(user => {
                        left_container_half2_author.innerHTML = user.data().name;
                        left_container_half2_title.innerHTML = user.data().occupation;
                    })
                );

                left_container_half2.append(left_container_half2_author);
                left_container_half2.append(left_container_half2_title);
                left_container.append(left_container_half2);
                main_container.append(left_container);

                let right_container = document.createElement('div');
                right_container.classList.add('twothirds');
                let right_container_content = document.createElement('div');
                right_container_content.classList.add('listing_description');
                right_container_content.classList.add('listing_text');
                right_container_content.innerHTML = doc.data().content;
                let right_container_score = document.createElement('div');
                right_container_score.classList.add('listing_description');
                right_container_score.classList.add('listing_text');
                right_container_score.innerHTML = "Score:" + doc.data().totalRating;

                right_container.append(right_container_content);
                right_container.append(right_container_score);
                main_container.append(right_container);

                resume_review_list.prepend(main_container);
            } else {
                let main_container = document.createElement('div');
                main_container.classList.add("feedback_listing");
                main_container.classList.add("container");

                let left_container = document.createElement('div');
                left_container.classList.add('third');
                left_container.classList.add('container');

                let left_container_half1 = document.createElement('div');
                left_container_half1.classList.add('half');

                let left_container_half1_profile_pic = document.createElement('i');
                left_container_half1_profile_pic.classList.add('center');
                left_container_half1_profile_pic.classList.add('fa');
                left_container_half1_profile_pic.classList.add('fa-user');
                left_container_half1_profile_pic.classList.add('fa-3x');

                left_container_half1.append(left_container_half1_profile_pic);
                left_container.append(left_container_half1);

                let left_container_half2 = document.createElement('div');
                left_container_half2.classList.add('half');
                let left_container_half2_author = document.createElement('div');
                left_container_half2_author.classList.add('listing_author');
                left_container_half2_author.classList.add('listing_text');
                let left_container_half2_title = document.createElement('div');
                left_container_half2_title.classList.add('listing_text');
                firestore.collection("users").where("uid", "==", doc.data().uid).limit(1).get().then((snapshot) =>
                    snapshot.docs.forEach(user => {
                        left_container_half2_author.innerHTML = user.data().name;
                        left_container_half2_title.innerHTML = user.data().occupation;
                    })
                );

                left_container_half2.append(left_container_half2_author);
                left_container_half2.append(left_container_half2_title);
                left_container.append(left_container_half2);
                main_container.append(left_container);

                let right_container = document.createElement('div');
                right_container.classList.add('twothirds');
                let right_container_content = document.createElement('div');
                right_container_content.classList.add('listing_description');
                right_container_content.classList.add('listing_text');
                right_container_content.innerHTML = doc.data().content;
                let right_container_score = document.createElement('div');
                right_container_score.classList.add('listing_description');
                right_container_score.classList.add('listing_text');
                right_container_score.innerHTML = "Score:" + doc.data().totalRating;

                right_container.append(right_container_content);
                right_container.append(right_container_score);
                main_container.append(right_container);

                resume_review_list.prepend(main_container);

            }
        }).catch(error => {

        });
    }
};

let show_current_resume_replies = function(current_resume_id){
    firestore.collection('resumes').doc(current_resume_id).collection('replies').orderBy("timestamp").get().then((snapshot) =>
        snapshot.docs.forEach(doc => {
            render_current_resume_replies(doc);
            // console.log(doc.data().author);
            // console.log(doc.data().content);
            // console.log(doc.data().timestamp.toDate());
        })
    );
    // console.log("show current reply");
};

let check_reply = function(){
  let vars = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = value;
  });
  let current_resume_id = vars['id'];
  firestore.collection("resumes").doc(current_resume_id).get().then(function(doc){
    if(doc.data().user == getCurrentUserId()){
      document.getElementById("current_resume_review_div").style.display= "none";
      document.getElementById("alreaady_reviewed_div").style.display = "none";
    }
    else{
      let status =true;
      firestore.collection("resumes").doc(current_resume_id).collection("replies")
            .where("uid","==",getCurrentUserId()).limit(1).get().then((snapshot) =>
              snapshot.docs.forEach(doc => {
                if(doc.exists){
                  status = false;
                }
            })
          ).then(function(){
            // console.log(status);
            if(status){
              document.getElementById("current_resume_review_div").style.display= "block";
              document.getElementById("alreaady_reviewed_div").style.display = "none";
            }
            else{
              let vars = {};
              window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                  vars[key] = value;
              });
              let current_resume_id = vars['id'];
              firestore.collection("resumes").doc(current_resume_id).collection("replies")
                .where("uid","==",getCurrentUserId()).limit(1).get().then((snapshot) =>
                  snapshot.docs.forEach(doc => {
                    // console.log(doc.data().content);
                      document.getElementById("user_reviewed").value = doc.data().content;
                      document.getElementById("user_rated").innerHTML = "You gave this review a " +doc.data().totalRating + "/5";
                })
              ).then(function(){
                document.getElementById("current_resume_review_div").style.display= "none";
                document.getElementById("alreaady_reviewed_div").style.display = "block";
              })
            }
          })
    }
  })
  .catch(function(error){
    // console.log(error);
  })
};
let check_user_reply = function(){
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    let current_resume_id = vars['id'];
    firestore.collection("resumes").doc(current_resume_id).get().then(function(doc){
      if(doc.data().user == getCurrentUserId()){
        document.getElementById("current_resume_review_div").style.display= "none";
        document.getElementById("already_reviewed_div").style.display = "none";
      }
    })
    .catch(function(error){
      // console.log(error);
    })
}
// let getUserRating = function (){
//   let user = firebase.auth().currentUser;
//   let users_ref = firestore.collection("users");
//   users_ref.where("uid", "==", getCurrentUserId()).limit(1).get().then((snapshot) =>
//       snapshot.docs.forEach(doc => {
//         document.getElementById("profileRating").innerHTML = doc.data().avgRating;
//       })
//   );
// };

let app = function() {

  let self = {};

  Vue.config.silent = false; // show all warnings

  // Sign In Through Firebase
  let signIn = function() {
    //get the value based on the html
    var e = document.getElementById("loginEmail").value;
    var p = document.getElementById("loginPassword").value;
    //firebase call to login
    firebase.auth().signInWithEmailAndPassword(e, p)
      .then(function() {
        //if it succeeds then do this
        // console.log("signed in");
        let user = firebase.auth().currentUser;
        // console.log(user.displayName, user.email, user.uid);
        location.href = 'profile';
      })
      .catch(function(error) {
        // Handle Errors here.
        let errorCode = error.code;
        let errorMessage = error.message;
        // console.log("Error Signing In ", errorMessage);
        document.getElementById("login_error").innerHTML = errorMessage;
        // ...
      });
  };

  //makes sure the fields are filled and correct
  let validateSignUp = function() {
    //get all the input values
    let email = document.getElementById("signEmail").value;
    let confirmEmail = document.getElementById("signConfirmEmail").value;
    let password = document.getElementById("signPassword").value;
    let confirmPassword = document.getElementById("signConfirmPassword").value;
    let name = document.getElementById("signName").value;
    let occupation = document.getElementById("signOccupation").value;
    // console.log(occupation);
    //if the emails do not match send an error
    if (!(email === confirmEmail)) {
      document.getElementById("signError").innerHTML = "Error: Emails Do Not Match";
      return false;
    } else if (!(password === confirmPassword)) {
      document.getElementById("signError").innerHTML = "Error: Passwords Do Not Match";
      return false;
    }else if (occupation === null || occupation === '') {
      document.getElementById("signError").innerHTML = "Error: Occupation field cannot be empty";
      return false;
    } else if (name === null || name === '') {
      document.getElementById("signError").innerHTML = "Error: Name field cannot be empty";
      return false;
    }else {
      return true;
    }
  };

  //sign up through firebase
  let signUp = function() {
    //grab input data
    let e = document.getElementById("signEmail").value;
    let p = document.getElementById("signPassword").value;
    let n = document.getElementById("signName").value;
    let o = document.getElementById("signOccupation").value;
    if (validateSignUp()) {
      //firebase call to make the account
      firebase.auth().createUserWithEmailAndPassword(e, p)
        .then(function() {
          //send the user email a verification
          let user = firebase.auth().currentUser;
          let token = getCurrentUserId();
          user.sendEmailVerification().then(function() {
            // console.log("Email Verification Sent");
            // Email sent.
          }).catch(function(error) {
            // An error happened.
            // console.log("Error sending Verification Email");
          });
          //update their display name in their user property
          user.updateProfile({
            //update their display Name
            displayName: n
          }).then(function() {
            // Update successful.
            // console.log("Successfully updated profile");
          }).catch(function(error) {
            // An error happened.
            // console.log("Error updating profile ", error);
          });
          //add their user info into the database
          firestore.collection("users").add({
              name: n,
              email: e,
              uid: token,
              totalRating: 0,
              occupation: o,
              numRate : 0
            })
            .then(function(docRef) {
              location.href = 'hub';
              // console.log("Document written with ID: ", docRef.id);
            })
            .catch(function(error) {
              // console.error("Error adding document: ", error);
            });
        })
        .catch(function(error) {
          // Handle Errors here.
          let errorCode = error.code;
          let errorMessage = error.message;
          // console.log("Error making account", errorMessage);
          document.getElementById("signError").innerHTML = errorMessage;
          // ...
        });
    }
  };
  //sends a link to reset their password

  let resetPassword = function() {
    let auth = firebase.auth();
    //get their email address input
    let emailAddress = document.getElementById("forgotEmail").value;
    //firebasecall to send the email
    auth.sendPasswordResetEmail(emailAddress).then(function() {
      // console.log("Send Password Reset Link to Email");
      document.getElementById("forgotSuccess").innerHTML = "Email Sent!";
      // Email sent.
    }).catch(function(error) {
      // An error happened.
      // console.log("Error sending password reset email ", error);
      document.getElementById("forgotError").innerHTML = error;
    });
  };

  let updateEmail = function(){
    //get documentbyId ref to the new email in profile
    let user = firebase.auth().currentUser;
    let newEmail = document.getElementById("newEmail").value;
    if(newEmail == null){
      document.getElementById("error_message").innerHTML = "Must Type A Valid Email";
    }
    else {
      user.updateEmail(newEmail).then(function() {
        document.getElementById("need_auth").style.display = "none";
        document.getElementById("update_email_field").style.display = "none";
        document.getElementById("update_email_button").style.display = "block";
          let users_ref = firestore.collection("users");
          users_ref.where("uid", "==", getCurrentUserId()).limit(1).get().then((snapshot) =>
              snapshot.docs.forEach(doc => {
                  // console.log(doc.id);
                  let user_ref = firestore.collection("users").doc(doc.id);
                  user_ref.update({
                      email: newEmail
                  }).then(function(){
                      // console.log("Successfully Updated Email");
                      this.show_email = false;
                      refresh();
                      document.getElementById("profileSuccess").innerHTML = "Successfully Updated Email";
                  }).catch(function(error){
                      // console.error("Error adding document: ", error);
                  })
              })
          );
      }).catch(function(error) {
        // An error happened.
        // console.log("Error updating email ", error);
        document.getElementById("profileError").innerHTML = error;
        document.getElementById("need_auth").style.display = "block";
      });
    }
  };

  let validatePassword = function(){
    let newP = document.getElementById("newPassword").value;
    let confirm = document.getElementById("confirmPassword").value;
    //all of the fields must be filled
    if(newP == null || confirm == null){
      document.getElementById("profileError").innerHTML = "Must fill fields";
      return false;
    }
    //if the passwords don't match
    else if(!(newP === confirm)){
      document.getElementById("profileError").innerHTML = "Passwords do not match";
      return false;
    }
    //it passes
    else{
      return true;
    }
  };

  let updatePassword = function(){
    let user = firebase.auth().currentUser;
    //instead of this newPassword, get their new one and check
    let newPassword = document.getElementById("newPassword").value;
      if(validatePassword()){
        user.updatePassword(newPassword).then(function() {
          document.getElementById("need_auth").style.display = "none";
          document.getElementById("update_password_field").style.display = "none";
          document.getElementById("update_password_button").style.display = "block";
          // console.log("Successfully updated Password");
          document.getElementById("profileSuccess").innerHTML = "Success Updated Password";
          // Update successful.
        }).catch(function(error) {
          // An error happened.
          // console.log("Error Updating Password ", error);
          document.getElementById("profileError").innerHTML = error;
          document.getElementById("need_auth").style.display = "block";
        });
      }
  };

  let updateProfile = function(){
      let user = firebase.auth().currentUser;
      let name = document.getElementById("newName").value;
      let users_ref = firestore.collection("users");
      user.updateProfile({
          displayName: name
      }).then(function(){
        document.getElementById("update_name_field").style.display = "none";
        document.getElementById("update_name_button").style.display = "block";
          users_ref.where("uid", "==", getCurrentUserId()).limit(1).get().then((snapshot) =>
              snapshot.docs.forEach(doc => {
                  // console.log(doc.id);
                  let user_ref = firestore.collection("users").doc(doc.id);
                  user_ref.update({
                      name: name
                  }).then(function(){
                      // console.log("User updated");
                      document.getElementById("profileSuccess").innerHTML = "Successfully Updated Name";
                      refresh();
                      this.show_name = false;
                  }).catch(function(error){
                      // console.log("Error updating user: ", error);
                  })
              })
          );
      }).catch(function(error){
           // console.log("Error updating profile ", error);
           document.getElementById("profileError").innerHTML = error;
      });
  };

  let reauthenticate = function(){
    let user = firebase.auth().currentUser;
    //get their provided ids
    let credential = firebase.auth.EmailAuthProvider.credential(
        document.getElementById("authEmail").value,
        document.getElementById("authPassword").value
    );
    // console.log(credential);
    // Prompt the user to re-provide their sign-in credentials
    user.reauthenticateAndRetrieveDataWithCredential(credential)
    .then(function() {
      // User re-authenticated.
      // console.log("Successfully reauthenticated");
      this.edit = true;
      document.getElementById("need_auth").style.display = "none";
      document.getElementById("profileSuccess").innerHTML = "Successfully Authorized";
    }).catch(function(error) {
      // An error happened.
      // console.log("Error reauthenticating user ", error);
      document.getElementById("profileError").innerHTML = error;
    });
  };

  let deleteUser = function(){
    let user = firebase.auth().currentUser;
    //if there is nothing in the field
    if(!this.authD){
      this.authD = true;
      document.getElementById("profileError").innerHTML = "Click Delete Again To Confirm";
    }
    else{
      user.delete().then(function() {
        document.getElementById("need_auth").style.display = "none";
        // console.log("Successfully deleted account");
        location.href='login';
        // User deleted.
      }).catch(function(error) {
        // An error happened.
        // console.log("Error deleting account ", error);
        document.getElementById("profileError").innerHTML = error;
        document.getElementById("need_auth").style.display = "block";
      });
    }
  };

  let signOut = function(){
    firebase.auth().signOut()
    .then(function() {
      // console.log("Signed Out");
      location.href='login';
    // Sign-out successful.
    }).catch(function(error) {
      // An error happened.
      // console.log("Error signing out: ", error);
      document.getElementById("profileError").innerHTML = error;
    });
  };

  let refresh = function () {
      firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
              document.getElementById("email").innerHTML = user.email;
              document.getElementById("name").innerHTML = user.displayName;
              // User is signed in.
          } else {
              // No user is signed in.
          }
      });
  };

  let uploadResume = function(){
      let selectedFile = document.getElementById('uploader').files[0];
      let uploadDescription = document.getElementById("uploadDescription").value;
      let filename = selectedFile.name;
      let storageRef = firebase.storage().ref('/resumes/' + filename);
      let uploadTask = storageRef.put(selectedFile);

      uploadTask.on('state_changed',
          function progress(snapshot){},
          function error(error){},
          function complete(){
          uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
              // console.log('File available at', downloadURL);
              firestore.collection('resumes').doc().set({
                  name:filename,
                  url: downloadURL,
                  user: getCurrentUserId(),
                  upload_time: firebase.firestore.FieldValue.serverTimestamp(),
                  totalRating: 0,
                  numRate : 0,
                  description : uploadDescription
              })
              .then(function(){
                // document.getElementById("upload_button").style.display = "block";
                document.getElementById("uploadDescription").value = "";
                // document.getElementById("upload_field").style.display = "none";
                document.getElementById("profileSuccess").innerHTML = "Uploaded Resume!"
              })
              .catch(function(error){
                document.getElementById("profileError").innerHTML = error;
              });
              document.getElementById('uploader').value = "";
          });
      });
  };
  let get_latest_resume = function(){
      // console.log("Getting latest resume");
      let query = firestore.collection("resumes").where("user", "==", getCurrentUserId());
      query = query.orderBy("upload_time");
      // console.log(query);
  };

  let renderResumeList = function(doc){
      let li = document.createElement('li');
      let name = document.createElement('span');
      let resume = document.createElement('iframe');
      let date = document.createElement('span');

      li.setAttribute('data-id', doc.id);
      name.textContent = doc.data().name;
      resume.src = doc.data().url;
      date.textContent = doc.data().upload_time.toDate();

      li.appendChild(name);
      li.appendChild(resume);
      li.appendChild(date);

      resume_list.appendChild(li);
  };

  let showResume = function(){
    firestore.collection("resumes").where("user", "==", getCurrentUserId()).get().then((snapshot) =>
        snapshot.docs.forEach(doc => {
            // console.log(doc.data().name);
            // console.log(doc.data().upload_time.toDate());
            // console.log(doc.data().url);
            renderResumeList(doc);
        })
    );
  };
  let checkLogin = function(){
      firebase.auth().onAuthStateChanged(function(user) {
          let profileTab = document.getElementById("profileTab");
          let loginTab = document.getElementById("loginTab");
          if (user) {
            document.getElementById("email").innerHTML = user.email;
            document.getElementById("name").innerHTML = user.displayName;
            profileTab.style.display = "block";
            loginTab.style.display = "none";
            // User is signed in.
          } else {
            // No user is signed in."
            profileTab.style.display = "none";
            loginTab.style.display = "block";
          }
      });
  };

  let add_reply = function(){
      // console.log("Adding a reply");
        let vars = {};
        window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
            vars[key] = value;
        });
        let current_resume_id = vars['id'];
        let resume_review_text = document.getElementById("review_textarea").value;
        let rate = document.forms[0];
        let rating = 0;
        for (var i = 0; i < rate.length; i++) {
          if (rate[i].checked) {
              rating = parseFloat(rate[i].value);
          }
        }
        if (rating == 0){
            document.getElementById("reply_error").style.display= "block";
            document.getElementById("reply_error").innerHTML = "Please Select A Rating";
            return;
        }
        // console.log(current_resume_id);
        // console.log(resume_review_text);

        firestore.collection("resumes").doc(current_resume_id).collection("replies").add({
            content: resume_review_text,
            uid: getCurrentUserId(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            totalRating: rating,
            userRating: 0
        }).then((docRef) => {
            // console.log("Document written with ID: ", docRef.id);
            setResumeRating(current_resume_id,rating,1);
            check_reply();
            docRef.get().then(doc =>{
              document.getElementById("reply_error").style.display= "none";
              render_current_resume_replies(doc);
              getResumeRating(current_resume_id,"current_resume_rating");
            });
        }).catch(function(error){
            // console.error("Error adding document: ", error);
        });

        document.getElementById("review_textarea").value = "";
    //call the update_resume_rating function from the new rating
    //also figure out how to instantly add the reply to the screen
  };

  let edit_reply = function(){
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    let current_resume_id = vars['id'];
    let rate = document.forms[1];
    let rating = 0;
    let resume_ref = firestore.collection("resumes").doc(current_resume_id);
    for (var i = 0; i < rate.length; i++) {
      if (rate[i].checked) {
          rating = parseFloat(rate[i].value);
      }
    }
    if (rating == 0){
        document.getElementById("reply_error").style.display= "block";
        document.getElementById("reply_error").innerHTML = "Please Select A Rating";
        return;
    }
    // console.log(rating);
    firestore.collection("resumes").doc(current_resume_id).get().then(function(doc){
      //set a new subtract variable
      let new_total = doc.data().totalRating;
        firestore.collection("resumes").doc(current_resume_id).collection("replies")
          .where("uid","==",getCurrentUserId()).limit(1).get().then((snapshot) =>
          snapshot.docs.forEach(doc => {
            let old_rating = doc.data().totalRating;
            firestore.collection("resumes").doc(current_resume_id).collection("replies").doc(doc.id).update({
              totalRating : rating
            })
            .then(function(){
              new_total = new_total + rating - old_rating;
              resume_ref.update({
                totalRating : new_total
              })
              check_reply();
              getResumeRating(current_resume_id,"current_resume_rating");
            })
            .catch(function(error){
              // console.log(error);
            })
          })
        )
    })

  }
  let delete_reply = function(){
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    let current_resume_id = vars['id'];
    firestore.collection("resumes").doc(current_resume_id).collection("replies")
      .where("uid","==",getCurrentUserId()).limit(1).get().then((snapshot) => {
        snapshot.docs.forEach(doc => {
          //the rate that the user gave in the review
          let prevRating = doc.data().totalRating;
          setResumeRating(current_resume_id,-prevRating,-1);
          firestore.collection("resumes").doc(current_resume_id).collection("replies").doc(doc.id).delete().then(function(){
            // console.log("Delete Success")
            check_reply();
            refresh_user_latest_rating();
          }).catch(function(error){
            // console.log("Error Deleting: ", error);
          });
        })
      });
  };
  var revealPassword = function() {
    var x = document.getElementById("signPassword");
    var y = document.getElementById("signConfirmPassword");
    if (x.type && y.type === "password") {
        x.type = "text";
        y.type = "text";
    }
    else {
        x.type = "password";
        y.type = "password";
    }
  };


  let getCurrentUserId = function(){
    return firebase.auth().currentUser.uid;
  };

  let show_email_fields = function(){
    document.getElementById("update_email_field").style.display = "block";
    document.getElementById("update_email_button").style.display = "none";
  };

  let show_email_button = function(){
    document.getElementById("update_email_field").style.display = "none";
    document.getElementById("update_email_button").style.display = "block";
  }
  let show_password_fields = function(){
    document.getElementById("update_password_field").style.display = "block";
    document.getElementById("update_password_button").style.display = "none";
  };

  let show_password_button = function(){
    document.getElementById("update_password_field").style.display = "none";
    document.getElementById("update_password_button").style.display = "block";
  }
  let show_name_fields = function(){
    document.getElementById("update_name_field").style.display = "block";
    document.getElementById("update_name_button").style.display = "none";
  };

  let show_name_button = function(){
    document.getElementById("update_name_field").style.display = "none";
    document.getElementById("update_name_button").style.display = "block";
  }

  let show_past_resume = function() {
      this.show_past_resumes = !this.show_past_resumes;
  };

  let show_feedback = function() {
      this.show_resume_feedback = !this.show_resume_feedback;
  };
  let show_upload_fields = function(){
    document.getElementById("upload_button").style.display = "none";
    document.getElementById("upload_field").style.display = "block";
  };

  let show_upload_button = function(){
    document.getElementById("upload_field").style.display = "none";
    document.getElementById("upload_button").style.display = "block";
  }

  let home_upload_button = function(){
    var user = firebase.auth().currentUser;
     if(user != null){
       location.href = 'hub';
     }
     else{
       location.href = 'signUp';
     }
   };
   let home_login_button = function(){
     var user = firebase.auth().currentUser;
      if(user != null){
        location.href = 'hub';
      }
      else{
        location.href = 'login';
      }
    };

  self.vue = new Vue({
    el: "#vue-div",
    delimiters: ['${', '}'],
    unsafeDelimiters: ['!{', '}'],
    data: {
        authD : false,
        show_past_resumes: false,
        show_resume_feedback: false,
        is_logged_in : false,
        is_user_resume: false
    },
    methods: {
        signIn: signIn,
        signUp: signUp,
        signOut : signOut,
        validateSignUp: validateSignUp,
        resetPassword : resetPassword,
        show_email_button : show_email_button,
        show_email_fields : show_email_fields,
        show_password_button : show_password_button,
        show_password_fields : show_password_fields,
        show_name_button : show_name_button,
        show_name_fields : show_name_fields,
        show_upload_button : show_upload_button,
        show_upload_fields : show_upload_fields,
        reauthenticate : reauthenticate,
        updateEmail : updateEmail,
        updatePassword : updatePassword,
        updateProfile : updateProfile,
        deleteUser : deleteUser,
        uploadResume : uploadResume,
        showResume : showResume,
        checkLogin : checkLogin,
        show_past_resume: show_past_resume,
        show_feedback: show_feedback,
        get_latest_resume: get_latest_resume,
        home_upload_button : home_upload_button,
        home_login_button : home_login_button,
        revealPassword : revealPassword,
        add_reply: add_reply,
        delete_reply: delete_reply,
        edit_reply: edit_reply
    }
  });


  return self;
};

var APP = null;
// No, this would evaluate it too soon.
// var APP = app();

// This will make everything accessible from the js console;
// for instance, self.x above would be accessible as APP.x

jQuery(function() {
  APP = app();
});
