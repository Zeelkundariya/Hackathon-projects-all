"""
Comprehensive fix for all Demand Uncertainty Analysis errors
"""

import streamlit as st
import pandas as pd
import traceback

def safe_display_analysis_results():
    """Safely display analysis results with comprehensive error handling."""
    
    try:
        # Check if results exist
        if 'analysis_results' not in st.session_state:
            st.warning("⚠️ No analysis results found. Please run analysis first.")
            return
        
        results = st.session_state.analysis_results
        
        if not results:
            st.warning("⚠️ Analysis results are empty. Please run analysis again.")
            return
        
        # Display executive summary with error handling
        st.subheader("📊 Executive Summary")
        
        try:
            comparison = results.get('comparison', {})
            if comparison and 'differences' in comparison:
                diffs = comparison['differences']
                
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    st.metric(
                        "Cost Impact",
                        f"{diffs.get('total_cost_pct', 0):+.2f}%",
                        help="Percentage change in total cost"
                    )
                
                with col2:
                    st.metric(
                        "Service Level Change",
                        f"{diffs.get('service_level_diff', 0):+.2%}",
                        help="Change in service level"
                    )
                
                with col3:
                    st.metric(
                        "Penalty Change",
                        f"${diffs.get('penalty_cost_diff', 0):,.0f}",
                        help="Change in demand penalty costs"
                    )
            else:
                st.info("📊 Comparison data not available. Run analysis to see results.")
                
        except Exception as e:
            st.error(f"❌ Error displaying executive summary: {str(e)}")
            st.exception(e)
        
        # Display detailed analysis with error handling
        st.subheader("📈 Detailed Analysis")
        
        try:
            # Cost Analysis
            with st.expander("💰 Cost Analysis", expanded=True):
                if comparison and 'differences' in comparison:
                    diffs = comparison['differences']
                    
                    st.write("**Cost Breakdown:**")
                    cost_data = {
                        'Component': ['Production', 'Transport', 'Holding', 'Penalty'],
                        'Deterministic': [
                            results.get('deterministic', {}).get('production_cost', 0),
                            results.get('deterministic', {}).get('transport_cost', 0),
                            results.get('deterministic', {}).get('holding_cost', 0),
                            results.get('deterministic', {}).get('demand_penalty', 0)
                        ],
                        'Stochastic': [
                            results.get('stochastic', {}).get('production_cost', 0),
                            results.get('stochastic', {}).get('transport_cost', 0),
                            results.get('stochastic', {}).get('holding_cost', 0),
                            results.get('stochastic', {}).get('demand_penalty', 0)
                        ],
                        'Difference': [
                            diffs.get('production_cost_diff', 0),
                            diffs.get('transport_cost_diff', 0),
                            diffs.get('holding_cost_diff', 0),
                            diffs.get('penalty_cost_diff', 0)
                        ]
                    }
                    
                    df_cost = pd.DataFrame(cost_data)
                    st.dataframe(df_cost, use_container_width=True, hide_index=True)
                else:
                    st.info("💰 Cost data not available. Run analysis to see cost breakdown.")
            
            # Performance Analysis
            with st.expander("📊 Performance Analysis", expanded=True):
                if comparison and 'differences' in comparison:
                    diffs = comparison['differences']
                    
                    st.write("**Performance Metrics:**")
                    perf_data = {
                        'Metric': ['Service Level', 'Facility Utilization', 'Total Production', 'Total Shipment'],
                        'Deterministic': [
                            results.get('deterministic', {}).get('service_level', 0) * 100,
                            results.get('deterministic', {}).get('facility_utilization', 0) * 100,
                            results.get('deterministic', {}).get('total_production', 0),
                            results.get('deterministic', {}).get('total_shipment', 0)
                        ],
                        'Stochastic': [
                            results.get('stochastic', {}).get('service_level', 0) * 100,
                            results.get('stochastic', {}).get('facility_utilization', 0) * 100,
                            results.get('stochastic', {}).get('total_production', 0),
                            results.get('stochastic', {}).get('total_shipment', 0)
                        ],
                        'Difference': [
                            diffs.get('service_level_diff', 0),
                            diffs.get('utilization_diff', 0),
                            0,  # Production difference not calculated
                            0   # Shipment difference not calculated
                        ]
                    }
                    
                    df_perf = pd.DataFrame(perf_data)
                    st.dataframe(df_perf, use_container_width=True, hide_index=True)
                else:
                    st.info("📊 Performance data not available. Run analysis to see performance metrics.")
            
            # Visualizations
            with st.expander("📈 Visualizations", expanded=True):
                plots = results.get('plots', {})
                if plots:
                    try:
                        for plot_name, fig in plots.items():
                            st.plotly_chart(fig, use_container_width=True)
                    except Exception as plot_error:
                        st.warning(f"⚠️ Could not display plot '{plot_name}': {str(plot_error)}")
                else:
                    st.info("📈 Visualizations not available. Run analysis with plot generation enabled.")
            
            # Strategic Insights
            with st.expander("💡 Strategic Insights", expanded=True):
                report = results.get('report', '')
                if report:
                    st.markdown(report)
                else:
                    st.info("💡 Strategic insights not available. Run analysis to generate insights.")
            
            # Scenarios
            with st.expander("🎲 Demand Scenarios", expanded=True):
                scenarios = results.get('scenarios', [])
                if scenarios:
                    scenario_data = []
                    for s in scenarios:
                        scenario_data.append({
                            'Scenario': s.get('name', 'Unknown'),
                            'Probability': f"{s.get('probability', 0):.2%}",
                            'Demand Multiplier': f"{s.get('demand_multiplier', 1.0):.2f}x",
                            'Description': s.get('description', 'No description')
                        })
                    
                    df_scenarios = pd.DataFrame(scenario_data)
                    st.dataframe(df_scenarios, use_container_width=True, hide_index=True)
                else:
                    st.info("🎲 Scenario data not available. Run analysis to see demand scenarios.")
        
        except Exception as e:
            st.error(f"❌ Error displaying detailed analysis: {str(e)}")
            st.exception(e)
        
        # Action buttons
        st.subheader("🚀 Next Steps")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🔄 Re-run Analysis", type="primary"):
                st.rerun()
        
        with col2:
            if st.button("📊 Configure Settings"):
                st.switch_page("Demand Uncertainty Settings")
        
        # Download results
        if st.button("📥 Download Results"):
            try:
                # Create downloadable report
                report_data = {
                    'Analysis Type': 'Demand Uncertainty Analysis',
                    'Timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'Results': str(results)
                }
                
                st.download_button(
                    label="📥 Download Analysis Report",
                    data=str(report_data),
                    file_name=f"demand_uncertainty_analysis_{pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')}.json",
                    mime="application/json"
                )
            except Exception as download_error:
                st.error(f"❌ Error preparing download: {str(download_error)}")
        
    except Exception as e:
        st.error(f"❌ Critical error in display function: {str(e)}")
        st.exception(e)
        st.error("🚨 Something went wrong. Please try again or contact an administrator.")

def safe_run_analysis(num_scenarios, volatility, run_det, run_stoch, generate_plots):
    """Safely run demand uncertainty analysis with comprehensive error handling."""
    
    try:
        # Validate inputs
        if not isinstance(num_scenarios, int) or num_scenarios < 1:
            st.error("❌ Invalid number of scenarios. Please enter a number between 1 and 10.")
            return False
        
        if not isinstance(volatility, (int, float)) or volatility < 0 or volatility > 1:
            st.error("❌ Invalid volatility. Please enter a value between 0 and 1.")
            return False
        
        # Show progress
        st.info(f"🔄 Starting analysis with {num_scenarios} scenarios and {volatility:.1%} volatility...")
        
        # Load data with error handling
        try:
            from simple_feasible_loader import load_simple_feasible_data
            base_data = load_simple_feasible_data("Dataset_Dummy_Clinker_3MPlan.xlsx", ['1'])
            st.success(f"✅ Data loaded: {len(base_data.plant_ids)} plants, {len(base_data.routes)} routes")
        except Exception as data_error:
            st.error(f"❌ Error loading data: {str(data_error)}")
            return False
        
        # Initialize analyzer with error handling
        try:
            from demand_uncertainty_analysis import DemandUncertaintyAnalyzer
            analyzer = DemandUncertaintyAnalyzer(base_data)
            st.success("✅ Analyzer initialized successfully")
        except Exception as analyzer_error:
            st.error(f"❌ Error initializing analyzer: {str(analyzer_error)}")
            return False
        
        # Generate scenarios with error handling
        try:
            scenarios = analyzer.generate_demand_scenarios(num_scenarios, volatility)
            st.success(f"✅ Generated {len(scenarios)} scenarios")
        except Exception as scenario_error:
            st.error(f"❌ Error generating scenarios: {str(scenario_error)}")
            return False
        
        # Run deterministic optimization with error handling
        det_metrics = None
        if run_det:
            try:
                with st.spinner("🔧 Running deterministic optimization..."):
                    det_metrics = analyzer.run_deterministic_optimization()
                    st.success(f"✅ Deterministic: ${det_metrics.total_cost:,.0f}, Service: {det_metrics.service_level:.1%}")
            except Exception as det_error:
                st.error(f"❌ Error in deterministic optimization: {str(det_error)}")
                return False
        
        # Run stochastic optimization with error handling
        stoch_metrics = None
        if run_stoch:
            try:
                with st.spinner("🎲 Running stochastic optimization..."):
                    stoch_metrics = analyzer.run_stochastic_optimization()
                    st.success(f"✅ Stochastic: ${stoch_metrics.total_cost:,.0f}, Service: {stoch_metrics.service_level:.1%}")
            except Exception as stoch_error:
                st.error(f"❌ Error in stochastic optimization: {str(stoch_error)}")
                return False
        
        # Get comparison with error handling
        try:
            comparison = analyzer.compare_performance()
            st.success("✅ Performance comparison completed")
        except Exception as comp_error:
            st.error(f"❌ Error in performance comparison: {str(comp_error)}")
            return False
        
        # Generate plots with error handling
        plots = {}
        if generate_plots:
            try:
                with st.spinner("📈 Generating visualizations..."):
                    plots = analyzer.create_comparison_plots()
                    st.success("✅ Visualizations generated")
            except Exception as plot_error:
                st.warning(f"⚠️ Plot generation failed: {str(plot_error)}")
                st.info("Analysis completed successfully, but visualizations could not be generated.")
        
        # Generate report with error handling
        try:
            with st.spinner("📄 Generating report..."):
                report = analyzer.generate_report()
                st.success("✅ Report generated")
        except Exception as report_error:
            st.warning(f"⚠️ Report generation failed: {str(report_error)}")
            report = "Report generation failed"
        
        # Store results in session state
        try:
            st.session_state.analyzer = analyzer
            st.session_state.analysis_results = {
                'analyzer': analyzer,
                'comparison': comparison,
                'plots': plots,
                'report': report,
                'scenarios': scenarios,
                'deterministic': det_metrics,
                'stochastic': stoch_metrics
            }
            st.success("🎉 Analysis completed successfully!")
            return True
        except Exception as storage_error:
            st.error(f"❌ Error storing results: {str(storage_error)}")
            return False
    
    except Exception as e:
        st.error(f"❌ Critical error in analysis: {str(e)}")
        st.exception(e)
        st.error("🚨 Something went wrong. Please try again or contact an administrator.")
        return False

print("✅ Comprehensive error handling functions created successfully")
