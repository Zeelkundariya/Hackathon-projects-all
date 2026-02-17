"""
Test Case Validator - Ensures Optimization.xlsx test cases pass
"""

import streamlit as st
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
import traceback

class OptimizationTestCaseValidator:
    """Validates optimization results against test cases from Optimization.xlsx"""
    
    def __init__(self):
        """Initialize the test case validator."""
        self.test_cases = self._load_test_cases()
    
    def _load_test_cases(self) -> List[Dict[str, Any]]:
        """Load test cases from Optimization.xlsx (mock implementation)."""
        # Mock test cases - replace with actual Excel file loading
        return [
            {
                "test_id": "TC001",
                "description": "Basic 3-plant, 3-demand optimization",
                "num_plants": 3,
                "num_demands": 3,
                "num_periods": 1,
                "expected_objective_range": (50000, 150000),
                "expected_service_level_min": 0.8,
                "constraints": {
                    "production_capacity": True,
                    "demand_satisfaction": True,
                    "transport_cost_calculation": True
                }
            },
            {
                "test_id": "TC002",
                "description": "Multi-period optimization",
                "num_plants": 3,
                "num_demands": 3,
                "num_periods": 3,
                "expected_objective_range": (150000, 450000),
                "expected_service_level_min": 0.75,
                "constraints": {
                    "production_capacity": True,
                    "demand_satisfaction": True,
                    "transport_cost_calculation": True,
                    "inventory_balance": True
                }
            },
            {
                "test_id": "TC003",
                "description": "High demand scenario",
                "num_plants": 3,
                "num_demands": 3,
                "num_periods": 1,
                "expected_objective_range": (80000, 200000),
                "expected_service_level_min": 0.7,
                "constraints": {
                    "production_capacity": True,
                    "demand_satisfaction": True,
                    "transport_cost_calculation": True,
                    "penalty_calculation": True
                }
            }
        ]
    
    def validate_optimization_results(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Validate optimization results against test cases."""
        validation_results = {
            "passed_tests": [],
            "failed_tests": [],
            "overall_status": "PASS",
            "validation_summary": {}
        }
        
        try:
            # Extract key metrics from results
            objective_value = results.get("objective_value", 0)
            cost_breakdown = results.get("cost_breakdown", {})
            production_df = results.get("production_df", pd.DataFrame())
            transport_df = results.get("transport_df", pd.DataFrame())
            inventory_df = results.get("inventory_df", pd.DataFrame())
            user_summary = results.get("user_data_summary", {})
            
            # Run each test case
            for test_case in self.test_cases:
                test_result = self._run_single_test_case(
                    test_case, objective_value, cost_breakdown, 
                    production_df, transport_df, inventory_df, user_summary
                )
                
                if test_result["status"] == "PASS":
                    validation_results["passed_tests"].append(test_result)
                else:
                    validation_results["failed_tests"].append(test_result)
                    validation_results["overall_status"] = "FAIL"
            
            # Create validation summary
            validation_results["validation_summary"] = {
                "total_tests": len(self.test_cases),
                "passed": len(validation_results["passed_tests"]),
                "failed": len(validation_results["failed_tests"]),
                "pass_rate": len(validation_results["passed_tests"]) / len(self.test_cases) * 100
            }
            
        except Exception as e:
            validation_results["overall_status"] = "ERROR"
            validation_results["error"] = str(e)
        
        return validation_results
    
    def _run_single_test_case(self, test_case: Dict[str, Any], objective_value: float, 
                             cost_breakdown: Dict[str, float], production_df: pd.DataFrame,
                             transport_df: pd.DataFrame, inventory_df: pd.DataFrame,
                             user_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single test case validation."""
        test_result = {
            "test_id": test_case["test_id"],
            "description": test_case["description"],
            "status": "PASS",
            "failures": [],
            "details": {}
        }
        
        try:
            # Test 1: Objective value range
            min_obj, max_obj = test_case["expected_objective_range"]
            if not (min_obj <= objective_value <= max_obj):
                test_result["status"] = "FAIL"
                test_result["failures"].append(f"Objective value {objective_value:,.0f} not in expected range [{min_obj:,.0f}, {max_obj:,.0f}]")
            
            test_result["details"]["objective_value"] = objective_value
            test_result["details"]["expected_range"] = f"[{min_obj:,.0f}, {max_obj:,.0f}]"
            
            # Test 2: Data structure validation
            constraints = test_case["constraints"]
            
            if constraints.get("production_capacity", False):
                # Check if production doesn't exceed capacity
                if not production_df.empty and "quantity" in production_df.columns and "capacity" in production_df.columns:
                    over_capacity = production_df[production_df["quantity"] > production_df["capacity"]]
                    if not over_capacity.empty:
                        test_result["status"] = "FAIL"
                        test_result["failures"].append(f"Production exceeds capacity in {len(over_capacity)} records")
                
                test_result["details"]["production_capacity_check"] = "PASS" if test_result["status"] == "PASS" else "FAIL"
            
            if constraints.get("demand_satisfaction", False):
                # Check if demand is satisfied (basic check)
                total_demand = user_summary.get("total_demand", 0)
                total_supply = user_summary.get("total_supply", 0)
                service_level = total_supply / total_demand if total_demand > 0 else 0
                
                if service_level < test_case["expected_service_level_min"]:
                    test_result["status"] = "FAIL"
                    test_result["failures"].append(f"Service level {service_level:.2%} below minimum {test_case['expected_service_level_min']:.2%}")
                
                test_result["details"]["service_level"] = f"{service_level:.2%}"
                test_result["details"]["min_service_level"] = f"{test_case['expected_service_level_min']:.2%}"
            
            if constraints.get("transport_cost_calculation", False):
                # Check transport cost calculation
                if not transport_df.empty and "quantity" in transport_df.columns and "transport_cost" in transport_df.columns:
                    # Basic validation: transport cost should be positive
                    negative_costs = transport_df[transport_df["transport_cost"] < 0]
                    if not negative_costs.empty:
                        test_result["status"] = "FAIL"
                        test_result["failures"].append(f"Negative transport costs found in {len(negative_costs)} records")
                
                test_result["details"]["transport_cost_check"] = "PASS" if test_result["status"] == "PASS" else "FAIL"
            
            if constraints.get("inventory_balance", False):
                # Check inventory balance equation
                if not inventory_df.empty:
                    required_cols = ["opening_stock", "production", "transport_out", "closing_stock"]
                    if all(col in inventory_df.columns for col in required_cols):
                        # Check: closing_stock = opening_stock + production - transport_out
                        inventory_df["calculated_closing"] = (
                            inventory_df["opening_stock"] + inventory_df["production"] - inventory_df["transport_out"]
                        )
                        balance_diff = abs(inventory_df["closing_stock"] - inventory_df["calculated_closing"])
                        imbalanced = inventory_df[balance_diff > 0.01]  # Allow small rounding errors
                        
                        if not imbalanced.empty:
                            test_result["status"] = "FAIL"
                            test_result["failures"].append(f"Inventory balance mismatch in {len(imbalanced)} records")
                
                test_result["details"]["inventory_balance_check"] = "PASS" if test_result["status"] == "PASS" else "FAIL"
            
            if constraints.get("penalty_calculation", False):
                # Check penalty cost calculation
                unmet_demand = user_summary.get("unmet_demand", 0)
                penalty_cost = cost_breakdown.get("demand_penalty", 0)
                expected_penalty = unmet_demand * 100  # $100 per unmet unit
                
                if abs(penalty_cost - expected_penalty) > 0.01:  # Allow small rounding errors
                    test_result["status"] = "FAIL"
                    test_result["failures"].append(f"Penalty cost {penalty_cost:,.0f} doesn't match expected {expected_penalty:,.0f}")
                
                test_result["details"]["penalty_cost"] = penalty_cost
                test_result["details"]["expected_penalty"] = expected_penalty
            
        except Exception as e:
            test_result["status"] = "ERROR"
            test_result["failures"].append(f"Test execution error: {str(e)}")
        
        return test_result

def render_test_case_validator():
    """Render the test case validator page."""
    
    st.title("🧪 Test Case Validator")
    st.markdown("Validate optimization results against test cases from Optimization.xlsx")
    
    validator = OptimizationTestCaseValidator()
    
    # Check if we have optimization results
    if 'last_optimization_results' not in st.session_state:
        st.warning("⚠️ No optimization results found. Please run optimization first.")
        if st.button("🚀 Run Optimization", type="primary"):
            st.switch_page("Run Optimization")
        return
    
    results = st.session_state.last_optimization_results
    
    # Display results summary
    st.markdown("### 📊 Optimization Results Summary")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Objective Value", f"${results.get('objective_value', 0):,.2f}")
    with col2:
        st.metric("Status", results.get('status', 'Unknown'))
    with col3:
        summary = results.get('user_data_summary', {})
        st.metric("Plants", summary.get('num_plants', 0))
    
    # Run validation
    if st.button("🧪 Run Test Validation", type="primary", use_container_width=True):
        with st.spinner("🔄 Running test validation..."):
            validation_results = validator.validate_optimization_results(results)
            
            # Display validation results
            st.markdown("---")
            st.markdown("### 🧪 Validation Results")
            
            # Overall status
            status_color = "🟢" if validation_results["overall_status"] == "PASS" else "🔴"
            st.markdown(f"### {status_color} Overall Status: {validation_results['overall_status']}")
            
            # Validation summary
            summary = validation_results["validation_summary"]
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                st.metric("Total Tests", summary["total_tests"])
            with col2:
                st.metric("Passed", summary["passed"], delta=None, delta_color="normal")
            with col3:
                st.metric("Failed", summary["failed"], delta=None, delta_color="inverse")
            with col4:
                st.metric("Pass Rate", f"{summary['pass_rate']:.1f}%")
            
            # Detailed results
            if validation_results["passed_tests"]:
                st.markdown("#### ✅ Passed Tests")
                for test in validation_results["passed_tests"]:
                    with st.expander(f"✅ {test['test_id']}: {test['description']}"):
                        st.json(test["details"])
            
            if validation_results["failed_tests"]:
                st.markdown("#### ❌ Failed Tests")
                for test in validation_results["failed_tests"]:
                    with st.expander(f"❌ {test['test_id']}: {test['description']}"):
                        st.error("Failures:")
                        for failure in test["failures"]:
                            st.error(f"• {failure}")
                        st.json(test["details"])
            
            # Recommendations
            if validation_results["overall_status"] == "FAIL":
                st.markdown("#### 💡 Recommendations")
                st.warning("""
                Some test cases failed. Please review the following:
                1. Check if production quantities exceed plant capacities
                2. Verify demand satisfaction rates
                3. Validate transport cost calculations
                4. Ensure inventory balance equations are correct
                5. Check penalty cost calculations
                """)
            else:
                st.success("🎉 All test cases passed! Your optimization results are valid.")
    
    # Display test cases information
    st.markdown("---")
    st.markdown("### 📋 Test Cases Information")
    
    for i, test_case in enumerate(validator.test_cases):
        with st.expander(f"📋 {test_case['test_id']}: {test_case['description']}"):
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("**Configuration:**")
                st.write(f"• Plants: {test_case['num_plants']}")
                st.write(f"• Demands: {test_case['num_demands']}")
                st.write(f"• Periods: {test_case['num_periods']}")
            
            with col2:
                st.markdown("**Expected Results:**")
                min_obj, max_obj = test_case["expected_objective_range"]
                st.write(f"• Objective Range: ${min_obj:,.0f} - ${max_obj:,.0f}")
                st.write(f"• Min Service Level: {test_case['expected_service_level_min']:.1%}")
            
            st.markdown("**Constraints Checked:**")
            for constraint, enabled in test_case["constraints"].items():
                if enabled:
                    st.write(f"• ✅ {constraint.replace('_', ' ').title()}")
                else:
                    st.write(f"• ❌ {constraint.replace('_', ' ').title()}")

print("✅ Test Case Validator created successfully")
