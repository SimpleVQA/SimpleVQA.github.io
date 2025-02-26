import React, { useState, useEffect } from 'react';
import ReactDOM from "react-dom"
import Leaderboard from "./LeaderboardComp"
import 'ag-grid-enterprise'

import "./index.css"

import mockDataComplete from "./mocks/code_task.json"
import mockDataLanguage from "./mocks/code_language.json"

import 'ag-grid-enterprise'

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const LeaderboardTabs = () => {
  // State to track the currently selected tab
  const [activeTab, setActiveTab] = useState('tab1');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFirstTable, setShowFirstTable] = useState(true);
  const [buttonText, setButtonText] = useState('Show in group?');
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleShowFirstTable = () => {
    setShowFirstTable(!showFirstTable);
    setButtonText(showFirstTable ? 'Show in lines?' : 'Show in groups?');
  };

  // Function to render the leaderboard based on the selected tab
  const renderLeaderboard = () => {
    // console.log(activeTab);
    switch (activeTab) {
      case 'tab1':
        switch (showFirstTable) {
          case true:
            return <Leaderboard theme={{ base: "light" }} args={[mockDataComplete, "lines", "tab1"]} />;
          case false:
            return <Leaderboard theme={{ base: "light" }} args={[mockDataComplete, "groups", "tab1"]} />;
        }
      case 'tab2':
        switch (showFirstTable) {
          case true:
            return <Leaderboard theme={{ base: "light" }} args={[mockDataLanguage, "lines", "tab2"]} />;
          case false:
            return <Leaderboard theme={{ base: "light" }} args={[mockDataLanguage, "groups", "tab2"]} />;
        }
      default:
        return <div>Select a tab</div>;
    }
  };
  return (
    <div className="tabs-container">
      <Stack direction="column" spacing={2}>
        {/* <Button onClick={() => setShowFirstTable(!showFirstTable)}>Show in groups?</Button> */}
        {/* <Button onClick={toggleShowFirstTable}>{buttonText}</Button> */}
        <ul className={`tabs ${isMobile ? 'mobile' : ''}`}>
          <li className={activeTab === 'tab1' ? 'is-active' : ''} onClick={() => setActiveTab('tab1')}><a>Tasks</a></li>
          <li className={activeTab === 'tab2' ? 'is-active' : ''} onClick={() => setActiveTab('tab2')}><a>Languages</a></li>
        </ul>
        <Button variant="contained" onClick={toggleShowFirstTable}>{buttonText}</Button>
      </Stack>

      <div className="tab-content">
        {renderLeaderboard()}
      </div>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <section className="hero">
      <div className="hero-body">
        <div className="container is-fluid">
          <div className="columns  is-fullwidth is-fullheight">
            <div style={{ backgroundColor: 'lightorange', width: '100%', height: '100%' }}>
            <div className="column has-text-centered is-fullwidth">
              {/* <h1 className="title is-1 publication-title">
                ⚔️CodeArena: Real-world Coding Tasks<br />Aligning Human Preferences and Model Generation
              </h1> */}
              <h1 className="title publication-title" style={{ fontSize: '2.5rem' }}>📷SimpleVQA</h1>
              {/* <h2 className="title is-3 publication-title">Real-world Coding Tasks</h2> */}
              <h2 className="title is-3 publication-title">Multimodal Factuality Evaluation</h2>
              <h2 className="title is-3 publication-title">for Multimodal Large Language Models</h2>
            <div className="is-4 publication-authors">
              <span className="is-4 publication-title-Cinzel">
                <a href="">Xianfu Cheng</a><sup>1*</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Wei Zhang</a><sup>1*</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Shiwei Zhang</a><sup>2*</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Jian Yang</a><sup>1*†</sup>,</span>
                <br></br>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Xiangyuan Guan</a><sup>1</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Xianjie Wu</a><sup>1</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Xiang Li</a><sup>1</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Ge Zhang</a><sup>3</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Jiaheng Liu</a><sup>3</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Yuying Mai</a><sup>4</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Yutao Zeng</a><sup>1</sup>,</span>
                <br></br>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Zhoufutu Wen</a><sup>3</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Ke Jin</a><sup>1</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Baorui Wang</a><sup>1</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Weixiao Zhou</a><sup>1</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Yunhong Lu</a><sup>5</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Tongliang Li</a><sup>1†</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Wenhao Huang</a><sup>3</sup>,</span>
              <span className="is-4 publication-title-Cinzel">
                <a href="">Zhoujun Li</a><sup>1,6</sup></span>
            </div>

            <div className="is-4 publication-authors">
              <span className="is-4 publication-title-Cinzel"><sup>1</sup>Beihang University;</span>
              <span className="is-4 publication-title-Cinzel"><sup>2</sup>Baidu Inc., China;</span>
              <span className="is-4 publication-title-Cinzel"><sup>3</sup>M-A-P;</span>
              <br></br>
              <span className="is-4 publication-title-Cinzel"><sup>4</sup>Beijing Jiaotong University;</span>
              <span className="is-4 publication-title-Cinzel"><sup>5</sup>Yantai University;</span>
              <span className="is-4 publication-title-Cinzel"><sup>6</sup>Shenzhen Intelligent Strong Technology Co.,Ltd.</span>
            </div>

              <div className="column has-text-centered">
                <div className="publication-links">
                  <span className="link-block">
                    <a href="https://arxiv.org/abs/2502.13059"
                      className="external-link button is-large is-rounded is-dark">
                      <span className="icon">
                        <i className="fas fa-file-pdf "></i>
                      </span>
                      <span className='publication-title-Cinzel'>Paper</span>
                    </a>
                  </span>
                  <span className="spacer"></span>
                  <span className="link-block">
                    <a href="https://github.com/SimpleVQA/SimpleVQA"
                      className="external-link button is-large is-rounded is-dark">
                      <span className="icon">
                        <i className="far fa-images"></i>
                      </span>
                      <span  className='publication-title-Cinzel'>Code & Evaluation Data</span>
                    </a>
                  </span>
                  <span className="spacer"></span>
                  <span className="link-block">
                    <a
                      href="https://SimpleVQA.github.io/"
                      className="external-link button is-large is-rounded is-dark"
                    >
                      <span className="icon">
                        <i className="fas fa-home"></i>
                      </span>
                      <span  className='publication-title-Cinzel'>Home</span>
                    </a>
                  </span>
                </div>
              </div>
              </div>
              <div className="column has-text-centered is-fullheight" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <LeaderboardTabs />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </React.StrictMode>,
  document.getElementById("root")
)