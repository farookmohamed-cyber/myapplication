package com.laboratory.model;

import com.laboratory.processing.TestProcessingReport;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import java.util.List;

@Entity
@DiscriminatorValue("URINE_TEST")
public class UrineTest extends LaboratoryTest {

    public UrineTest() {
        super();
    }

    @Override
    public TestCategory resolveCategory() {
        return TestCategory.URINE_TEST;
    }

    @Override
    public TestProcessingReport processTest(Sample sample) {
        List<String> steps = List.of(
                "1. Inspect physical color, clarity, and specific gravity of specimen " + sample.getSampleCode(),
                "2. Perform multi-parameter colorimetric reagent strip urinalysis",
                "3. Centrifuge 10 mL aliquot at 2,000 RPM for 5 minutes",
                "4. Examine urinary sediment under phase-contrast microscopy against " + getNormalRange()
        );
        return buildReport(
                sample,
                TestCategory.URINE_TEST,
                steps,
                "UrineTest processor completed dipstick reagent and microscopic sediment review via " + getProcessingProcedure()
        );
    }
}
